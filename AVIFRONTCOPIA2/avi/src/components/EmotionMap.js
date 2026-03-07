export const EmotionMap = {
  neutral: {
    jawOpen: 0,
    mouthSmile: 0,
    mouthFrown: 0,
    browDownLeft: 0,
    browDownRight: 0,
    cheekPuff: 0,
  },

  happy: {
    mouthSmile: 1,
    cheekPuff: 0.3,
    jawOpen: 0.1,
  },

  sad: {
    mouthFrown: 1,
    browDownLeft: 0.5,
    browDownRight: 0.5,
  },

  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    jawOpen: 0.2,
  },

  surprised: {
    jawOpen: 1,
    mouthSmile: 0.1,
  }
};