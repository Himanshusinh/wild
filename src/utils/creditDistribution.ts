export interface CreditDistributionPlan {
  planA: number; // 12,360 credits
  planB: number; // 24,720 credits
  planC: number; // 61,800 credits
  planD: number; // 197,760 credits
  free: number;  // 4,120 credits
}

export interface ModelCreditInfo {
  srNo: number;
  modelName: string;
  priceToPay: number;
  overCharge: number;
  userCost: number;
  creditsPerGeneration: number;
  plans: CreditDistributionPlan;
}

export const creditDistributionData: ModelCreditInfo[] = [
  {
    srNo: 1,
    modelName: "FLUX.1 Kontext [pro]",
    priceToPay: 0.04,
    overCharge: 0.01,
    userCost: 0.05,
    creditsPerGeneration: 100,
    plans: {
      planA: 123.6,
      planB: 247.2,
      planC: 618,
      planD: 1977.6,
      free: 20
    }
  },
  {
    srNo: 37,
    modelName: "Seedream v4 (T2I)",
    priceToPay: 0.06,
    overCharge: 0.015,
    userCost: 0.075,
    creditsPerGeneration: 120,
    plans: {
      planA: 82.4,
      planB: 164.8,
      planC: 412,
      planD: 1318.4,
      free: 27.46666667
    }
  },
  {
    srNo: 2,
    modelName: "FLUX.1 Kontext [max]",
    priceToPay: 0.08,
    overCharge: 0.015,
    userCost: 0.095,
    creditsPerGeneration: 190,
    plans: {
      planA: 65.05263158,
      planB: 130.1052632,
      planC: 325.2631579,
      planD: 1040.842105,
      free: 21.68421053
    }
  },
  {
    srNo: 3,
    modelName: "FLUX 1.1 [pro] Ultra",
    priceToPay: 0.06,
    overCharge: 0.015,
    userCost: 0.075,
    creditsPerGeneration: 150,
    plans: {
      planA: 82.4,
      planB: 164.8,
      planC: 412,
      planD: 1318.4,
      free: 27.46666667
    }
  },
  {
    srNo: 4,
    modelName: "FLUX 1.1 [pro]",
    priceToPay: 0.04,
    overCharge: 0.015,
    userCost: 0.055,
    creditsPerGeneration: 110,
    plans: {
      planA: 112.3636364,
      planB: 224.7272727,
      planC: 561.8181818,
      planD: 1797.818182,
      free: 37.45454545
    }
  },
  {
    srNo: 5,
    modelName: "FLUX.1 [dev]",
    priceToPay: 0.03,
    overCharge: 0.015,
    userCost: 0.045,
    creditsPerGeneration: 90,
    plans: {
      planA: 137.3333333,
      planB: 274.6666667,
      planC: 686.6666667,
      planD: 2197.333333,
      free: 45.77777778
    }
  },
  {
    srNo: 6,
    modelName: "FLUX.1 [pro]",
    priceToPay: 0.05,
    overCharge: 0.015,
    userCost: 0.065,
    creditsPerGeneration: 130,
    plans: {
      planA: 95.07692308,
      planB: 190.1538462,
      planC: 475.3846154,
      planD: 1521.230769,
      free: 31.69230769
    }
  },
  // Imagen 4 family (Google) - image generation
  {
    srNo: 6.1,
    modelName: "Imagen 4 Ultra",
    priceToPay: 0.06,
    overCharge: 0.015,
    userCost: 0.075,
    creditsPerGeneration: 150,
    plans: {
      planA: 82.4,
      planB: 164.8,
      planC: 412,
      planD: 1318.4,
      free: 27.46666667
    }
  },
  {
    srNo: 6.2,
    modelName: "Imagen 4",
    priceToPay: 0.04,
    overCharge: 0.015,
    userCost: 0.055,
    creditsPerGeneration: 110,
    plans: {
      planA: 112.3636364,
      planB: 224.7272727,
      planC: 561.8181818,
      planD: 1797.818182,
      free: 37.45454545
    }
  },
  {
    srNo: 6.3,
    modelName: "Imagen 4 Fast",
    priceToPay: 0.02,
    overCharge: 0.015,
    userCost: 0.035,
    creditsPerGeneration: 70,
    plans: {
      planA: 176.5714286,
      planB: 353.1428571,
      planC: 882.8571429,
      planD: 2825.142857,
      free: 58.85714286
    }
  },
  // Kling video models (Replicate)
  {
    srNo: 50.1,
    modelName: "Kling 2.5 Turbo Pro T2V 5s",
    priceToPay: 0.42,
    overCharge: 0.06,
    userCost: 0.48,
    creditsPerGeneration: 900,
    plans: { planA: 12.875, planB: 25.75, planC: 64.375, planD: 206, free: 4.291666667 }
  },
  {
    srNo: 50.2,
    modelName: "Kling 2.5 Turbo Pro T2V 10s",
    priceToPay: 0.84,
    overCharge: 0.06,
    userCost: 0.90,
    creditsPerGeneration: 1800,
    plans: { planA: 6.866666667, planB: 13.73333333, planC: 34.33333333, planD: 109.8666667, free: 2.288888889 }
  },
  {
    srNo: 50.3,
    modelName: "Kling 2.5 Turbo Pro I2V 5s",
    priceToPay: 0.42,
    overCharge: 0.06,
    userCost: 0.48,
    creditsPerGeneration: 960,
    plans: { planA: 12.875, planB: 25.75, planC: 64.375, planD: 206, free: 4.291666667 }
  },
  {
    srNo: 50.4,
    modelName: "Kling 2.5 Turbo Pro I2V 10s",
    priceToPay: 0.84,
    overCharge: 0.06,
    userCost: 0.90,
    creditsPerGeneration: 1800,
    plans: { planA: 6.866666667, planB: 13.73333333, planC: 34.33333333, planD: 109.8666667, free: 2.288888889 }
  },
  {
    srNo: 51.1,
    modelName: "Kling 2.1 Master T2V 5s",
    priceToPay: 1.4,
    overCharge: 0.06,
    userCost: 1.46,
    creditsPerGeneration: 2920,
    plans: { planA: 4.232876712, planB: 8.465753425, planC: 21.16438356, planD: 67.7260274, free: 1.410958904 }
  },
  {
    srNo: 51.2,
    modelName: "Kling 2.1 Master T2V 10s",
    priceToPay: 2.8,
    overCharge: 0.06,
    userCost: 2.86,
    creditsPerGeneration: 5720,
    plans: { planA: 2.160839161, planB: 4.321678322, planC: 10.8041958, planD: 34.57342657, free: 0.7202797203 }
  },
  {
    srNo: 51.3,
    modelName: "Kling 2.1 Master I2V 5s",
    priceToPay: 1.4,
    overCharge: 0.06,
    userCost: 1.46,
    creditsPerGeneration: 2920,
    plans: { planA: 4.232876712, planB: 8.465753425, planC: 21.16438356, planD: 67.7260274, free: 1.410958904 }
  },
  {
    srNo: 51.4,
    modelName: "Kling 2.1 Master I2V 10s",
    priceToPay: 2.8,
    overCharge: 0.06,
    userCost: 2.86,
    creditsPerGeneration: 5720,
    plans: { planA: 2.160839161, planB: 4.321678322, planC: 10.8041958, planD: 34.57342657, free: 0.7202797203 }
  },
  {
    srNo: 52.1,
    modelName: "Kling 2.1 T2V 5s 720p",
    priceToPay: 0.25,
    overCharge: 0.06,
    userCost: 0.31,
    creditsPerGeneration: 620,
    plans: { planA: 19.93548387, planB: 39.87096774, planC: 99.67741935, planD: 318.9677419, free: 6.64516129 }
  },
  {
    srNo: 52.2,
    modelName: "Kling 2.1 T2V 5s 1080p",
    priceToPay: 0.45,
    overCharge: 0.06,
    userCost: 0.51,
    creditsPerGeneration: 1020,
    plans: { planA: 12.11764706, planB: 24.23529412, planC: 60.58823529, planD: 193.8823529, free: 4.039215686 }
  },
  {
    srNo: 52.3,
    modelName: "Kling 2.1 T2V 10s 720p",
    priceToPay: 0.5,
    overCharge: 0.06,
    userCost: 0.56,
    creditsPerGeneration: 1120,
    plans: { planA: 11.03571429, planB: 22.07142857, planC: 55.17857143, planD: 176.5714286, free: 3.678571429 }
  },
  {
    srNo: 52.4,
    modelName: "Kling 2.1 T2V 10s 1080p",
    priceToPay: 0.9,
    overCharge: 0.06,
    userCost: 0.96,
    creditsPerGeneration: 1920,
    plans: { planA: 6.4375, planB: 12.875, planC: 32.1875, planD: 103, free: 2.145833333 }
  },
  {
    srNo: 52.5,
    modelName: "Kling 2.1 I2V 5s 720p",
    priceToPay: 0.25,
    overCharge: 0.06,
    userCost: 0.31,
    creditsPerGeneration: 620,
    plans: { planA: 19.93548387, planB: 39.87096774, planC: 99.67741935, planD: 318.9677419, free: 6.64516129 }
  },
  {
    srNo: 52.6,
    modelName: "Kling 2.1 I2V 5s 1080p",
    priceToPay: 0.45,
    overCharge: 0.06,
    userCost: 0.51,
    creditsPerGeneration: 1020,
    plans: { planA: 12.11764706, planB: 24.23529412, planC: 60.58823529, planD: 193.8823529, free: 4.039215686 }
  },
  {
    srNo: 52.7,
    modelName: "Kling 2.1 I2V 10s 720p",
    priceToPay: 0.5,
    overCharge: 0.06,
    userCost: 0.56,
    creditsPerGeneration: 1120,
    plans: { planA: 11.03571429, planB: 22.07142857, planC: 55.17857143, planD: 176.5714286, free: 3.678571429 }
  },
  {
    srNo: 52.8,
    modelName: "Kling 2.1 I2V 10s 1080p",
    priceToPay: 0.9,
    overCharge: 0.06,
    userCost: 0.96,
    creditsPerGeneration: 1920,
    plans: { planA: 6.4375, planB: 12.875, planC: 32.1875, planD: 103, free: 2.145833333 }
  },
  {
    srNo: 7,
    modelName: "Runway Gen 4 Image 720p",
    priceToPay: 0.05,
    overCharge: 0.015,
    userCost: 0.065,
    creditsPerGeneration: 130,
    plans: {
      planA: 95.07692308,
      planB: 190.1538462,
      planC: 475.3846154,
      planD: 1521.230769,
      free: 31.69230769
    }
  },
  {
    srNo: 8,
    modelName: "Runway Gen 4 Image 1080p",
    priceToPay: 0.08,
    overCharge: 0.015,
    userCost: 0.095,
    creditsPerGeneration: 190,
    plans: {
      planA: 65.05263158,
      planB: 130.1052632,
      planC: 325.2631579,
      planD: 1040.842105,
      free: 21.68421053
    }
  },
  {
    srNo: 9,
    modelName: "Runway Gen 4 Image Turbo",
    priceToPay: 0.02,
    overCharge: 0.015,
    userCost: 0.035,
    creditsPerGeneration: 70,
    plans: {
      planA: 176.5714286,
      planB: 353.1428571,
      planC: 882.8571429,
      planD: 2825.142857,
      free: 58.85714286
    }
  },
  {
    srNo: 10,
    modelName: "Minimax Image-01",
    priceToPay: 0.0035,
    overCharge: 0.015,
    userCost: 0.0185,
    creditsPerGeneration: 37,
    plans: {
      planA: 334.0540541,
      planB: 668.1081081,
      planC: 1670.27027,
      planD: 5344.864865,
      free: 111.3513514
    }
  },
  {
    srNo: 11,
    modelName: "Google nano banana (T2I)",
    priceToPay: 0.039,
    overCharge: 0.015,
    userCost: 0.054,
    creditsPerGeneration: 108,
    plans: {
      planA: 114.4444444,
      planB: 228.8888889,
      planC: 572.2222222,
      planD: 1831.111111,
      free: 38.14814815
    }
  },
  {
    srNo: 12,
    modelName: "Google nano banana (I2I)",
    priceToPay: 0.039,
    overCharge: 0.015,
    userCost: 0.054,
    creditsPerGeneration: 108,
    plans: {
      planA: 114.4444444,
      planB: 228.8888889,
      planC: 572.2222222,
      planD: 1831.111111,
      free: 38.14814815
    }
  },
  {
    srNo: 13,
    modelName: "Music 1.5 (Up to 90s)",
    priceToPay: 0.03,
    overCharge: 0.015,
    userCost: 0.045,
    creditsPerGeneration: 90,
    plans: {
      planA: 137.3333333,
      planB: 274.6666667,
      planC: 686.6666667,
      planD: 2197.333333,
      free: 45.77777778
    }
  },
  {
    srNo: 14,
    modelName: "Minimax-Hailuo-01 512P 6s",
    priceToPay: 0.1,
    overCharge: 0.01,
    userCost: 0.11,
    creditsPerGeneration: 220,
    plans: {
      planA: 56.18181818,
      planB: 112.3636364,
      planC: 280.9090909,
      planD: 898.9090909,
      free: 9.090909091
    }
  },
  {
    srNo: 15,
    modelName: "Minimax-Hailuo-02 512P 10s",
    priceToPay: 0.15,
    overCharge: 0.01,
    userCost: 0.16,
    creditsPerGeneration: 320,
    plans: {
      planA: 38.625,
      planB: 77.25,
      planC: 193.125,
      planD: 618,
      free: 6.25
    }
  },
  {
    srNo: 16,
    modelName: "Minimax-Hailuo-02 768P 6s",
    priceToPay: 0.28,
    overCharge: 0.01,
    userCost: 0.29,
    creditsPerGeneration: 580,
    plans: {
      planA: 21.31034483,
      planB: 42.62068966,
      planC: 106.5517241,
      planD: 340.9655172,
      free: 3.448275862
    }
  },
  {
    srNo: 17,
    modelName: "Minimax-Hailuo-02 768P 10s",
    priceToPay: 0.56,
    overCharge: 0.01,
    userCost: 0.57,
    creditsPerGeneration: 1140,
    plans: {
      planA: 10.84210526,
      planB: 21.68421053,
      planC: 54.21052632,
      planD: 173.4736842,
      free: 1.754385965
    }
  },
  {
    srNo: 18,
    modelName: "Minimax-Hailuo-02 1080P 6s",
    priceToPay: 0.49,
    overCharge: 0.01,
    userCost: 0.5,
    creditsPerGeneration: 1000,
    plans: {
      planA: 12.36,
      planB: 24.72,
      planC: 61.8,
      planD: 197.76,
      free: 2
    }
  },
  {
    srNo: 19,
    modelName: "T2V-01-Director",
    priceToPay: 0.43,
    overCharge: 0.06,
    userCost: 0.49,
    creditsPerGeneration: 980,
    plans: {
      planA: 12.6122449,
      planB: 25.2244898,
      planC: 63.06122449,
      planD: 201.7959184,
      free: 4.204081633
    }
  },
  {
    srNo: 20,
    modelName: "I2V-01-Director",
    priceToPay: 0.43,
    overCharge: 0.06,
    userCost: 0.49,
    creditsPerGeneration: 980,
    plans: {
      planA: 12.6122449,
      planB: 25.2244898,
      planC: 63.06122449,
      planD: 201.7959184,
      free: 4.204081633
    }
  },
  {
    srNo: 21,
    modelName: "S2V-01",
    priceToPay: 0.65,
    overCharge: 0.06,
    userCost: 0.71,
    creditsPerGeneration: 1420,
    plans: {
      planA: 8.704225352,
      planB: 17.4084507,
      planC: 43.52112676,
      planD: 139.2676056,
      free: 2.901408451
    }
  },
  {
    srNo: 22,
    modelName: "veo3 t2v 4s",
    priceToPay: 1.6,
    overCharge: 0.03,
    userCost: 1.63,
    creditsPerGeneration: 3260,
    plans: {
      planA: 3.791411043,
      planB: 7.582822086,
      planC: 18.95705521,
      planD: 60.66257669,
      free: 0.6134969325
    }
  },
  {
    srNo: 23,
    modelName: "veo3 t2v 6s",
    priceToPay: 2.4,
    overCharge: 0.03,
    userCost: 2.43,
    creditsPerGeneration: 4860,
    plans: {
      planA: 2.543209877,
      planB: 5.086419753,
      planC: 12.71604938,
      planD: 40.69135802,
      free: 0.4115226337
    }
  },
  {
    srNo: 24,
    modelName: "veo3 t2v 8s",
    priceToPay: 3.2,
    overCharge: 0.03,
    userCost: 3.23,
    creditsPerGeneration: 6460,
    plans: {
      planA: 1.913312693,
      planB: 3.826625387,
      planC: 9.566563467,
      planD: 30.6130031,
      free: 0.3095975232
    }
  },
  {
    srNo: 25,
    modelName: "veo3 i2v 8s",
    priceToPay: 3.2,
    overCharge: 0.03,
    userCost: 3.23,
    creditsPerGeneration: 6460,
    plans: {
      planA: 1.913312693,
      planB: 3.826625387,
      planC: 9.566563467,
      planD: 30.6130031,
      free: 0.3095975232
    }
  },
  {
    srNo: 26,
    modelName: "veo3 fast t2v 4s",
    priceToPay: 0.6,
    overCharge: 0.03,
    userCost: 0.63,
    creditsPerGeneration: 1260,
    plans: {
      planA: 9.80952381,
      planB: 19.61904762,
      planC: 49.04761905,
      planD: 156.952381,
      free: 1.587301587
    }
  },
  {
    srNo: 27,
    modelName: "veo3 fast t2v 6s",
    priceToPay: 0.9,
    overCharge: 0.03,
    userCost: 0.93,
    creditsPerGeneration: 1860,
    plans: {
      planA: 6.64516129,
      planB: 13.29032258,
      planC: 33.22580645,
      planD: 106.3225806,
      free: 1.075268817
    }
  },
  {
    srNo: 28,
    modelName: "veo3 fast t2v 8s",
    priceToPay: 1.2,
    overCharge: 0.03,
    userCost: 1.23,
    creditsPerGeneration: 2460,
    plans: {
      planA: 5.024390244,
      planB: 10.04878049,
      planC: 25.12195122,
      planD: 80.3902439,
      free: 0.8130081301
    }
  },
  {
    srNo: 29,
    modelName: "veo3 fast i2v 8s",
    priceToPay: 1.2,
    overCharge: 0.03,
    userCost: 1.23,
    creditsPerGeneration: 2460,
    plans: {
      planA: 5.024390244,
      planB: 10.04878049,
      planC: 25.12195122,
      planD: 80.3902439,
      free: 0.8130081301
    }
  },
  {
    srNo: 30,
    modelName: "RW veo3 8s",
    priceToPay: 3.2,
    overCharge: 0.03,
    userCost: 3.23,
    creditsPerGeneration: 6460,
    plans: {
      planA: 1.913312693,
      planB: 3.826625387,
      planC: 9.566563467,
      planD: 30.6130031,
      free: 0.3095975232
    }
  },
  {
    srNo: 31,
    modelName: "Gen-4 Aleph 10s",
    priceToPay: 1.5,
    overCharge: 0.03,
    userCost: 1.53,
    creditsPerGeneration: 3060,
    plans: {
      planA: 4.039215686,
      planB: 8.078431373,
      planC: 20.19607843,
      planD: 64.62745098,
      free: 0.6535947712
    }
  },
  {
    srNo: 32,
    modelName: "Gen-4 Turbo 5s",
    priceToPay: 0.25,
    overCharge: 0.06,
    userCost: 0.31,
    creditsPerGeneration: 620,
    plans: {
      planA: 19.93548387,
      planB: 39.87096774,
      planC: 99.67741935,
      planD: 318.9677419,
      free: 6.64516129
    }
  },
  {
    srNo: 33,
    modelName: "Gen-4 Turbo 10s",
    priceToPay: 0.5,
    overCharge: 0.06,
    userCost: 0.56,
    creditsPerGeneration: 1120,
    plans: {
      planA: 11.03571429,
      planB: 22.07142857,
      planC: 55.17857143,
      planD: 176.5714286,
      free: 3.678571429
    }
  },
  {
    srNo: 34,
    modelName: "Gen-3a Turbo 5s",
    priceToPay: 0.25,
    overCharge: 0.06,
    userCost: 0.31,
    creditsPerGeneration: 620,
    plans: {
      planA: 19.93548387,
      planB: 39.87096774,
      planC: 99.67741935,
      planD: 318.9677419,
      free: 6.64516129
    }
  },
  {
    srNo: 35,
    modelName: "Gen-3a Turbo 10s",
    priceToPay: 0.5,
    overCharge: 0.06,
    userCost: 0.56,
    creditsPerGeneration: 1120,
    plans: {
      planA: 11.03571429,
      planB: 22.07142857,
      planC: 55.17857143,
      planD: 176.5714286,
      free: 3.678571429
    }
  },
  {
    srNo: 36,
    modelName: "ChatGPT Prompt Enhancer (4o)",
    priceToPay: 0.00875,
    overCharge: 0.00125,
    userCost: 0.01,
    creditsPerGeneration: 1,
    plans: {
      planA: 618,
      planB: 1236,
      planC: 3200,
      planD: 9888,
      free: 206
    }
  },
  // Replicate models from sheet
  {
    srNo: 37,
    modelName: "replicate/bytedance/seedream-4",
    priceToPay: 0.03,
    overCharge: 0.015,
    userCost: 0.045,
    creditsPerGeneration: 90,
    plans: { planA: 137.3333333, planB: 274.6666667, planC: 711.1111111, planD: 2197.333333, free: 45.77777778 }
  },
  {
    srNo: 38,
    modelName: "replicate/ideogram-ai/ideogram-v3-turbo",
    priceToPay: 0.03,
    overCharge: 0.015,
    userCost: 0.045,
    creditsPerGeneration: 90,
    plans: { planA: 137.3333333, planB: 274.6666667, planC: 711.1111111, planD: 2197.333333, free: 45.77777778 }
  },
  {
    srNo: 39,
    modelName: "replicate/ideogram-ai/ideogram-v3-quality",
    priceToPay: 0.09,
    overCharge: 0.015,
    userCost: 0.105,
    creditsPerGeneration: 210,
    plans: { planA: 58.85714286, planB: 117.7142857, planC: 294.2857143, planD: 941.7142857, free: 19.61904762 }
  },
  {
    srNo: 40,
    modelName: "replicate/leonardoai/lucid-origin",
    priceToPay: 0.0765,
    overCharge: 0.015,
    userCost: 0.0915,
    creditsPerGeneration: 183,
    plans: { planA: 67.54098361, planB: 135.0819672, planC: 337.704918, planD: 1080.655738, free: 22.5136612 }
  },
  {
    srNo: 41,
    modelName: "replicate/leonardoai/phoenix-1.0",
    priceToPay: 0.075,
    overCharge: 0.015,
    userCost: 0.09,
    creditsPerGeneration: 180,
    plans: { planA: 68.66666667, planB: 137.3333333, planC: 343.3333333, planD: 1098.666667, free: 22.88888889 }
  },
  {
    srNo: 42,
    modelName: "replicate/fermatresearch/magic-image-refiner",
    priceToPay: 0.027,
    overCharge: 0.015,
    userCost: 0.042,
    creditsPerGeneration: 84,
    plans: { planA: 147.1428571, planB: 294.2857143, planC: 761.9047619, planD: 2354.285714, free: 49.04761905 }
  },
  {
    srNo: 40,
    modelName: "replicate/philz1337x/clarity-upscaler",
    priceToPay: 0.016,
    overCharge: 0.015,
    userCost: 0.031,
    creditsPerGeneration: 62,
    plans: { planA: 199.3548387, planB: 398.7096774, planC: 1032.258065, planD: 3189.677419, free: 66.4516129 }
  },
  {
    srNo: 41,
    modelName: "replicate/ lucataco/remove-bg",
    priceToPay: 0.00049,
    overCharge: 0.01501,
    userCost: 0.0155,
    creditsPerGeneration: 31,
    plans: { planA: 398.7096774, planB: 797.4193548, planC: 2064.516129, planD: 6379.354839, free: 132.9032258 }
  },
  {
    srNo: 42,
    modelName: "replicate/851-labs/background-remover",
    priceToPay: 0.00031,
    overCharge: 0.01519,
    userCost: 0.0155,
    creditsPerGeneration: 31,
    plans: { planA: 398.7096774, planB: 797.4193548, planC: 2064.516129, planD: 6379.354839, free: 132.9032258 }
  },
  {
    srNo: 42.1,
    modelName: "replicate/bria/eraser",
    priceToPay: 0.035,
    overCharge: 0.015,
    userCost: 0.05,
    creditsPerGeneration: 100,
    plans: { planA: 123.6, planB: 247.2, planC: 618, planD: 1977.6, free: 41.2 }
  },
  {
    srNo: 43,
    modelName: "replicate/nightmareai/real-esrgan",
    priceToPay: 0.0012,
    overCharge: 0.015,
    userCost: 0.0162,
    creditsPerGeneration: 32.4,
    plans: { planA: 381.4814815, planB: 762.962963, planC: 1975.308642, planD: 6103.703704, free: 127.1604938 }
  },
  {
    srNo: 44,
    modelName: "replicate/mv-lab/swin2sr",
    priceToPay: 0.0065,
    overCharge: 0.015,
    userCost: 0.0215,
    creditsPerGeneration: 43,
    plans: { planA: 287.4418605, planB: 574.8837209, planC: 1488.372093, planD: 4599.069767, free: 95.81395349 }
  }
  ,
  // New Replicate models pricing
  {
    srNo: 45,
    modelName: "Ideogram 3 Quality",
    priceToPay: 0.09,
    overCharge: 0.01,
    userCost: 0.1,
    creditsPerGeneration: 200,
    plans: {
      planA: 61.8,
      planB: 123.6,
      planC: 309,
      planD: 988.8,
      free: 10
    }
  },
  {
    srNo: 46,
    modelName: "Lucid Origin",
    priceToPay: 0.0765,
    overCharge: 0.01,
    userCost: 0.0865,
    creditsPerGeneration: 173,
    plans: {
      planA: 71.44508671,
      planB: 142.8901734,
      planC: 357.2254335,
      planD: 1143.121387,
      free: 11.56069364
    }
  },
  {
    srNo: 47,
    modelName: "Phoenix 1.0",
    priceToPay: 0.075,
    overCharge: 0.01,
    userCost: 0.085,
    creditsPerGeneration: 170,
    plans: {
      planA: 72.70588235,
      planB: 145.4117647,
      planC: 363.5294118,
      planD: 1163.294118,
      free: 11.76470588
    }
  },
  // Wan 2.5 Standard (T2V/I2V)
  {
    srNo: 48,
    modelName: "Wan 2.5 T2V 5s 480p",
    priceToPay: 0.25,
    overCharge: 0.06,
    userCost: 0.31,
    creditsPerGeneration: 480,
    plans: {
      planA: 19.93548387,
      planB: 39.87096774,
      planC: 99.67741935,
      planD: 318.9677419,
      free: 6.64516129
    }
  },
  {
    srNo: 49,
    modelName: "Wan 2.5 I2V 5s 480p",
    priceToPay: 0.25,
    overCharge: 0.06,
    userCost: 0.31,
    creditsPerGeneration: 480,
    plans: {
      planA: 19.93548387,
      planB: 39.87096774,
      planC: 99.67741935,
      planD: 318.9677419,
      free: 6.64516129
    }
  },
  {
    srNo: 50,
    modelName: "Wan 2.5 T2V 5s 720p",
    priceToPay: 0.5,
    overCharge: 0.06,
    userCost: 0.56,
    creditsPerGeneration: 900,
    plans: {
      planA: 11.03571429,
      planB: 22.07142857,
      planC: 55.17857143,
      planD: 176.5714286,
      free: 3.678571429
    }
  },
  {
    srNo: 51,
    modelName: "Wan 2.5 I2V 5s 720p",
    priceToPay: 0.5,
    overCharge: 0.06,
    userCost: 0.56,
    creditsPerGeneration: 900,
    plans: {
      planA: 11.03571429,
      planB: 22.07142857,
      planC: 55.17857143,
      planD: 176.5714286,
      free: 3.678571429
    }
  },
  {
    srNo: 52,
    modelName: "Wan 2.5 T2V 5s 1080p",
    priceToPay: 0.75,
    overCharge: 0.06,
    userCost: 0.81,
    creditsPerGeneration: 1460,
    plans: {
      planA: 7.62962963,
      planB: 15.25925926,
      planC: 38.14814815,
      planD: 122.0740741,
      free: 2.543209877
    }
  },
  {
    srNo: 53,
    modelName: "Wan 2.5 I2V 5s 1080p",
    priceToPay: 0.75,
    overCharge: 0.06,
    userCost: 0.81,
    creditsPerGeneration: 1460,
    plans: {
      planA: 7.62962963,
      planB: 15.25925926,
      planC: 38.14814815,
      planD: 122.0740741,
      free: 2.543209877
    }
  },
  {
    srNo: 54,
    modelName: "Wan 2.5 T2V 10s 480p",
    priceToPay: 0.5,
    overCharge: 0.06,
    userCost: 0.56,
    creditsPerGeneration: 900,
    plans: {
      planA: 11.03571429,
      planB: 22.07142857,
      planC: 55.17857143,
      planD: 176.5714286,
      free: 3.678571429
    }
  },
  {
    srNo: 55,
    modelName: "Wan 2.5 I2V 10s 480p",
    priceToPay: 0.5,
    overCharge: 0.06,
    userCost: 0.56,
    creditsPerGeneration: 900,
    plans: {
      planA: 11.03571429,
      planB: 22.07142857,
      planC: 55.17857143,
      planD: 176.5714286,
      free: 3.678571429
    }
  },
  {
    srNo: 56,
    modelName: "Wan 2.5 T2V 10s 720p",
    priceToPay: 1,
    overCharge: 0.06,
    userCost: 1.06,
    creditsPerGeneration: 1740,
    plans: {
      planA: 5.830188679,
      planB: 11.66037736,
      planC: 29.1509434,
      planD: 93.28301887,
      free: 1.943396226
    }
  },
  {
    srNo: 57,
    modelName: "Wan 2.5 I2V 10s 720p",
    priceToPay: 1,
    overCharge: 0.06,
    userCost: 1.06,
    creditsPerGeneration: 1740,
    plans: {
      planA: 5.830188679,
      planB: 11.66037736,
      planC: 29.1509434,
      planD: 93.28301887,
      free: 1.943396226
    }
  },
  {
    srNo: 58,
    modelName: "Wan 2.5 T2V 10s 1080p",
    priceToPay: 1.5,
    overCharge: 0.06,
    userCost: 1.56,
    creditsPerGeneration: 2860,
    plans: {
      planA: 3.961538462,
      planB: 7.923076923,
      planC: 19.80769231,
      planD: 63.38461538,
      free: 1.320512821
    }
  },
  {
    srNo: 59,
    modelName: "Wan 2.5 I2V 10s 1080p",
    priceToPay: 1.5,
    overCharge: 0.06,
    userCost: 1.56,
    creditsPerGeneration: 2860,
    plans: {
      planA: 3.961538462,
      planB: 7.923076923,
      planC: 19.80769231,
      planD: 63.38461538,
      free: 1.320512821
    }
  },
  // Wan 2.5 Fast (T2V/I2V)
  {
    srNo: 60,
    modelName: "Wan 2.5 Fast T2V 5s 720p",
    priceToPay: 0.34,
    overCharge: 0.06,
    userCost: 0.4,
    creditsPerGeneration: 740,
    plans: {
      planA: 15.45,
      planB: 30.9,
      planC: 77.25,
      planD: 247.2,
      free: 5.15
    }
  },
  {
    srNo: 61,
    modelName: "Wan 2.5 Fast I2V 5s 720p",
    priceToPay: 0.34,
    overCharge: 0.06,
    userCost: 0.4,
    creditsPerGeneration: 740,
    plans: {
      planA: 15.45,
      planB: 30.9,
      planC: 77.25,
      planD: 247.2,
      free: 5.15
    }
  },
  {
    srNo: 62,
    modelName: "Wan 2.5 Fast T2V 5s 1080p",
    priceToPay: 0.51,
    overCharge: 0.06,
    userCost: 0.57,
    creditsPerGeneration: 1080,
    plans: {
      planA: 10.84210526,
      planB: 21.68421053,
      planC: 54.21052632,
      planD: 173.4736842,
      free: 3.614035088
    }
  },
  {
    srNo: 63,
    modelName: "Wan 2.5 Fast I2V 5s 1080p",
    priceToPay: 0.51,
    overCharge: 0.06,
    userCost: 0.57,
    creditsPerGeneration: 1080,
    plans: {
      planA: 10.84210526,
      planB: 21.68421053,
      planC: 54.21052632,
      planD: 173.4736842,
      free: 3.614035088
    }
  },
  {
    srNo: 64,
    modelName: "Wan 2.5 Fast T2V 10s 720p",
    priceToPay: 0.68,
    overCharge: 0.06,
    userCost: 0.74,
    creditsPerGeneration: 1420,
    plans: {
      planA: 8.351351351,
      planB: 16.7027027,
      planC: 41.75675676,
      planD: 133.6216216,
      free: 2.783783784
    }
  },
  {
    srNo: 65,
    modelName: "Wan 2.5 Fast I2V 10s 720p",
    priceToPay: 0.68,
    overCharge: 0.06,
    userCost: 0.74,
    creditsPerGeneration: 1420,
    plans: {
      planA: 8.351351351,
      planB: 16.7027027,
      planC: 41.75675676,
      planD: 133.6216216,
      free: 2.783783784
    }
  },
  {
    srNo: 66,
    modelName: "Wan 2.5 Fast T2V 10s 1080p",
    priceToPay: 1.02,
    overCharge: 0.06,
    userCost: 1.08,
    creditsPerGeneration: 2100,
    plans: {
      planA: 5.722222222,
      planB: 11.44444444,
      planC: 28.61111111,
      planD: 91.55555556,
      free: 1.907407407
    }
  },
  {
    srNo: 67,
    modelName: "Wan 2.5 Fast I2V 10s 1080p",
    priceToPay: 1.02,
    overCharge: 0.06,
    userCost: 1.08,
    creditsPerGeneration: 2100,
    plans: {
      planA: 5.722222222,
      planB: 11.44444444,
      planC: 28.61111111,
      planD: 91.55555556,
      free: 1.907407407
    }
  }
];

// Helper functions for easy access
export const getModelByName = (modelName: string): ModelCreditInfo | undefined => {
  return creditDistributionData.find(model => model.modelName === modelName);
};

export const getModelsByProvider = (provider: string): ModelCreditInfo[] => {
  return creditDistributionData.filter(model => 
    model.modelName.toLowerCase().includes(provider.toLowerCase())
  );
};

export const getCreditCostForPlan = (modelName: string, plan: keyof CreditDistributionPlan): number | undefined => {
  const model = getModelByName(modelName);
  return model?.plans[plan];
};

// Plan constants for reference
export const PLAN_CREDITS = {
  PLAN_A: 12360,
  PLAN_B: 24720,
  PLAN_C: 61800,
  PLAN_D: 197760,
  FREE: 4120
} as const;

export const PRICING_VERSION = 'bfl-v2';
