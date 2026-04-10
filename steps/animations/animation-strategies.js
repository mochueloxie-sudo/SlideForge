/**
 * Animation Strategy Library
 * 6 种情感模式 → FFmpeg filter 组合
 * 继承自 frontend-slides 动画模式参考
 */

const ANIMATION_STRATEGIES = {
  // Dramatic / Cinematic: 慢速、大尺度、视差感
  // 注意：勿使用 fade=in 做片头淡入。step6 按「每页一段 MP4」再 concat；每段开头的 fade=in
  // 会从黑场拉起，concat 后表现为封面黑屏 + 翻页黑幕。动效仅保留不引入全透明起手的滤镜。
  dramatic: {
    duration: 1.2, // 秒
    fade_in_frames: 0,
    effects: [
      'zoompan=z=\'min(zoom+0.0015,1.05)\':d=75'
    ],
    description: 'Slow scale-in (no black fade — concat-safe)'
  },

  // Techy / Futuristic: 霓虹、glitch、网格
  techy: {
    duration: 0.8,
    fade_in_frames: 0,
    effects: [
      'hue=h=0.05*sin(2*PI*t):s=0.1', // 微妙的色相偏移
      'colorchannelmixer=aa=0.08' // 发光感
    ],
    description: 'Neon glow + subtle glitch'
  },

  // Playful / Friendly: 弹性、活泼
  playful: {
    duration: 0.6,
    fade_in_frames: 0,
    effects: [
      'scale=iw*1.02:ih*1.02:flags=neighbor', // 轻微 overshoot
      'split=2[in1][in2];[in1]crop=iw:ih/2:0:0[top];[in2]crop=iw:ih/2:0:ih/2[bottom];[top][bottom]vstack' // 动态感
    ],
    description: 'Bouncy entrance'
  },

  // Professional / Corporate: 干净、快速、克制
  professional: {
    duration: 0.4,
    fade_in_frames: 0,
    effects: [
      'setsar=1'
    ],
    description: 'Clean, concat-safe (no fade)'
  },

  // Calm / Minimal: 极慢、柔和
  calm: {
    duration: 1.5,
    fade_in_frames: 0,
    effects: [
      'boxblur=2:1'
    ],
    description: 'Soft blur (no black fade — concat-safe)'
  },

  // Editorial / Magazine: 优雅、序列
  editorial: {
    duration: 0.9,
    fade_in_frames: 0,
    effects: [
      'crop=iw:ih-2:0:1' // 轻微裁剪产生动态
    ],
    description: 'Elegant reveal'
  }
};

/**
 * 根据 design_params 选择动画策略
 * @param {Object} design - design_params
 * @param {String} sceneType - cover/content/summary
 * @returns {Object} 动画策略对象
 */
function selectAnimationStrategy(design, sceneType) {
  // 1. 优先使用 design 中显式指定的 animation_style
  if (design.animation_style && ANIMATION_STRATEGIES[design.animation_style]) {
    return ANIMATION_STRATEGIES[design.animation_style];
  }

  // 2. 根据 design_mode 推断
  const mode = design.design_mode || 'optimized';
  if (mode.includes('neon') || mode.includes('cyber')) {
    return ANIMATION_STRATEGIES.techy;
  }
  if (mode.includes('minimal') || mode.includes('apple')) {
    return sceneType === 'cover' ? ANIMATION_STRATEGIES.calm : ANIMATION_STRATEGIES.professional;
  }
  if (mode.includes('dark-botanical') || mode.includes('vintage')) {
    return ANIMATION_STRATEGIES.editorial;
  }
  if (mode.includes('creative') || mode.includes('voltage')) {
    return ANIMATION_STRATEGIES.playful;
  }

  // 3. 默认：根据场景类型
  if (sceneType === 'cover' || sceneType === 'summary') {
    return ANIMATION_STRATEGIES.dramatic; // 封面用大动效
  }

  // 4. 回退：professional
  return ANIMATION_STRATEGIES.professional;
}

/**
 * 生成 FFmpeg filter 字符串
 * @param {Object} strategy - 动画策略
 * @param {Number} audioDuration - 音频时长（秒）
 * @returns {String} FFmpeg -vf 参数
 */
function buildFFmpegFilter(strategy, audioDuration) {
  const effects = strategy.effects.map(e => {
    return e.replace(/\$duration/g, audioDuration.toString());
  }).filter(Boolean);

  const chain = effects.join(',');
  // 空链时仍需合法 -vf（部分 ffmpeg 对缺省 vf 与 loop 组合挑剔）
  return chain || 'setsar=1';
}

module.exports = {
  ANIMATION_STRATEGIES,
  selectAnimationStrategy,
  buildFFmpegFilter
};
