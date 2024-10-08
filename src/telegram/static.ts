import type { TelegramEnums } from './index.js'

export const DIALOG_FILTER = {
  title: 'Seven Gram',
  emoticon: '❤️',
}

export const CHANNELS: Record<TelegramEnums.ChannelType, {
  title: string
  about: string
}> = {
  logger: {
    title: 'Seven Gram | Logs',
    about: 'Here you can see your logs',
  },
}

export const DEFAULT_FINGERPRINT = {
  version: '4.2.1',
  visitorId: '',
  components: {
    fonts: {
      value: [
        'sans-serif-thin',
      ],
      duration: 132,
    },
    domBlockers: {
      value: [],
      duration: 59,
    },
    fontPreferences: {
      value: {
        default: 145.90625,
        apple: 145.90625,
        serif: 164.71875,
        sans: 145.90625,
        mono: 132.625,
        min: 72.953125,
        system: 145.90625,
      },
      duration: 36,
    },
    audio: {
      value: 0.00007444995,
      duration: 111,
    },
    screenFrame: {
      value: [
        0,
        0,
        0,
        0,
      ],
      duration: 1,
    },
    canvas: null,
    osCpu: {
      duration: 0,
    },
    languages: {
      value: [
        [
          'ru',
        ],
      ],
      duration: 7,
    },
    colorDepth: {
      value: 24,
      duration: 0,
    },
    deviceMemory: {
      value: 4,
      duration: 0,
    },
    screenResolution: {
      value: [
        800,
        360,
      ],
      duration: 0,
    },
    hardwareConcurrency: {
      value: 8,
      duration: 0,
    },
    timezone: {
      value: 'Europe/Moscow',
      duration: 9,
    },
    sessionStorage: {
      value: true,
      duration: 0,
    },
    localStorage: {
      value: true,
      duration: 0,
    },
    indexedDB: {
      value: true,
      duration: 1,
    },
    openDatabase: {
      value: true,
      duration: 0,
    },
    cpuClass: {
      duration: 0,
    },
    platform: {
      value: 'Linux aarch64',
      duration: 0,
    },
    plugins: {
      value: [],
      duration: 2,
    },
    touchSupport: {
      value: {
        maxTouchPoints: 5,
        touchEvent: true,
        touchStart: true,
      },
      duration: 0,
    },
    vendor: {
      value: 'Google Inc.',
      duration: 0,
    },
    vendorFlavors: {
      value: [],
      duration: 0,
    },
    cookiesEnabled: {
      value: true,
      duration: 6,
    },
    colorGamut: {
      value: 'srgb',
      duration: 0,
    },
    invertedColors: {
      duration: 1,
    },
    forcedColors: {
      value: false,
      duration: 0,
    },
    monochrome: {
      value: 0,
      duration: 0,
    },
    contrast: {
      value: 0,
      duration: 0,
    },
    reducedMotion: {
      value: false,
      duration: 0,
    },
    reducedTransparency: {
      value: false,
      duration: 1,
    },
    hdr: {
      value: false,
      duration: 0,
    },
    math: {
      value: {
        acos: 1.4473588658278522,
        acosh: 709.889355822726,
        acoshPf: 355.291251501643,
        asin: 0.12343746096704435,
        asinh: 0.881373587019543,
        asinhPf: 0.8813735870195429,
        atanh: 0.5493061443340548,
        atanhPf: 0.5493061443340548,
        atan: 0.4636476090008061,
        sin: 0.8178819121159085,
        sinh: 1.1752011936438014,
        sinhPf: 2.534342107873324,
        cos: -0.8390715290095377,
        cosh: 1.5430806348152437,
        coshPf: 1.5430806348152437,
        tan: -1.4214488238747245,
        tanh: 0.7615941559557649,
        tanhPf: 0.7615941559557649,
        exp: 2.718281828459045,
        expm1: 1.718281828459045,
        expm1Pf: 1.718281828459045,
        log1p: 2.3978952727983707,
        log1pPf: 2.3978952727983707,
        powPI: 1.9275814160560204e-50,
      },
      duration: 2,
    },
    pdfViewerEnabled: {
      value: false,
      duration: 0,
    },
    architecture: {
      value: 127,
      duration: 0,
    },
    applePay: {
      value: -1,
      duration: 0,
    },
    privateClickMeasurement: {
      duration: 0,
    },
    webGlBasics: {
      value: {
        version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
        vendor: 'WebKit',
        vendorUnmasked: 'ARM',
        renderer: 'WebKit WebGL',
        rendererUnmasked: 'Mali-G57 MC2',
        shadingLanguageVersion: 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)',
      },
      duration: 57,
    },
    webGlExtensions: null,
  },
}
