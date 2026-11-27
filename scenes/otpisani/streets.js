/**
 * The four streets of the fight for Belgrade, October 1944, in the order it went (owner's decision, 2026-11-26), each
 * a panorama 5000 × 1024 px that slides by. Everything is in the panorama's pixels: `man` is how tall a man 1.8 m
 * stands where his feet are. A German steps out of a door, its middle at `x`; or rises in an `opening`, somewhere
 * from `from` to `to`: behind cover, seen only above its top, or in a window, seen only inside it, from its sill up
 * to his chest; others cross a street at `feet` between `from` and `to`, as does the stage's `vehicle`: the tank, the
 * armoured car or the half-track. A stage ends once `quota` Germans have fallen. Measured on the pictures, 2026-11-27.
 */
export const panorama = { width: 5000, height: 1024 }

/** A man on the far pavement, by the house fronts, and one crossing the near street. */
const far = 105, near = 150

const door = (x, feet, man = far) => ({ from: x, to: x, feet, man })
const cover = (from, to, top, feet, man = far) => ({ from, to, feet, man, opening: { bottom: top } })
/** A window from `left` to `right` and from `top` to its sill, `bottom`; the sill is at his hips. */
const windowSpot = (left, right, top, bottom, man = far) => ({ from: (left + right) / 2, to: (left + right) / 2,
  feet: bottom + man * .55, man, opening: { left, right, top, bottom } })

export default [
  {
    image: 'background/otpisani/bulevar-kralja-aleksandra.webp', quota: 10, vehicle: 'tank',
    supplies: [[590, 870], [1800, 873], [3270, 881], [4710, 883]],
    spots: [
      door(252, 860), door(1365, 830), door(1688, 858), door(2030, 860), door(3025, 866), door(3925, 870),
      door(4155, 870), door(4620, 868), door(4915, 865),
      cover(880, 925, 826, 862), cover(975, 1170, 828, 862), cover(1530, 1665, 822, 860), cover(1740, 1960, 815, 862),
      cover(4400, 4500, 822, 870),
      windowSpot(55, 115, 475, 590), windowSpot(390, 445, 485, 595), windowSpot(553, 597, 505, 610), windowSpot(872, 913, 528, 615),
      windowSpot(993, 1048, 475, 580), windowSpot(1150, 1203, 478, 583), windowSpot(1344, 1393, 486, 588),
      windowSpot(1527, 1577, 495, 595), windowSpot(1668, 1706, 528, 620), windowSpot(2017, 2052, 550, 635),
      windowSpot(50, 118, 680, 795), windowSpot(988, 1052, 660, 780), windowSpot(1523, 1582, 668, 780),
      windowSpot(2985, 3045, 420, 505), windowSpot(3238, 3287, 435, 518), windowSpot(3314, 3360, 580, 668),
      windowSpot(3238, 3287, 730, 820), windowSpot(3795, 3840, 520, 620), windowSpot(4000, 4042, 530, 625),
      windowSpot(4135, 4178, 515, 610), windowSpot(4320, 4365, 515, 610), windowSpot(4462, 4500, 535, 622),
      windowSpot(4733, 4785, 518, 615),
    ],
    streets: [{ feet: 950, man: near, from: 0, to: 5000 }],
  },
  {
    image: 'background/otpisani/terazije.webp', quota: 12, vehicle: 'armoredCar',
    supplies: [[315, 879], [1730, 894], [2760, 925], [4450, 929]],
    spots: [
      door(152, 862), door(555, 862), door(872, 857), door(1230, 858), door(1465, 852), door(1528, 852),
      door(2970, 915), door(3060, 915), door(3510, 915), door(3880, 915),
      cover(210, 280, 842, 864), cover(370, 500, 820, 864), cover(625, 815, 834, 864), cover(960, 1120, 830, 862),
      cover(1300, 1365, 838, 860),
      // behind the fountain's rim, nearer than the houses
      cover(1560, 2200, 848, 880, 112),
      cover(2835, 2930, 888, 916), cover(3200, 3290, 888, 916), cover(3560, 3700, 875, 916), cover(4195, 4340, 902, 916),
      windowSpot(33, 80, 490, 595), windowSpot(222, 268, 495, 600), windowSpot(450, 487, 505, 645), windowSpot(540, 572, 333, 412),
      windowSpot(627, 683, 328, 402), windowSpot(627, 683, 468, 550), windowSpot(818, 853, 478, 560), windowSpot(965, 998, 482, 565),
      windowSpot(1100, 1130, 490, 570), windowSpot(965, 1005, 628, 690), windowSpot(1207, 1242, 530, 615),
      windowSpot(1362, 1396, 538, 622), windowSpot(1608, 1638, 558, 638), windowSpot(1830, 1857, 570, 645),
      windowSpot(2108, 2132, 598, 665), windowSpot(2855, 2888, 640, 713), windowSpot(3065, 3095, 647, 715),
      windowSpot(3157, 3188, 655, 718), windowSpot(3315, 3340, 660, 722), windowSpot(3650, 3672, 670, 735),
      windowSpot(3945, 3968, 698, 745),
    ],
    streets: [{ feet: 950, man: near, from: 0, to: 5000 }],
  },
  {
    image: 'background/otpisani/kalemegdan.webp', quota: 12, vehicle: 'halftrack',
    supplies: [[212, 879], [1260, 884], [3030, 863], [4480, 870]],
    spots: [
      door(62, 862), door(3360, 852), door(3960, 838),
      cover(260, 480, 835, 865), cover(640, 1100, 838, 865), cover(1300, 1440, 842, 870), cover(2965, 3185, 818, 850),
      cover(3485, 3605, 798, 850), cover(4245, 4405, 800, 850), cover(4350, 4505, 830, 855),
      windowSpot(45, 88, 542, 635), windowSpot(148, 192, 542, 635), windowSpot(350, 378, 575, 635), windowSpot(108, 200, 720, 825),
      // the empty windows of the ruins
      windowSpot(292, 345, 735, 820), windowSpot(530, 665, 728, 805), windowSpot(820, 950, 750, 820), windowSpot(1025, 1095, 762, 805),
      windowSpot(3228, 3275, 733, 780),
    ],
    streets: [{ feet: 950, man: near, from: 0, to: 5000 }],
  },
  {
    image: 'background/otpisani/savski-most.webp', quota: 14, vehicle: 'tank',
    supplies: [[390, 792], [1190, 792], [3185, 744], [4525, 744]],
    spots: [
      // the warehouse on the quay
      door(980, 782, 95),
      cover(750, 845, 702, 785, 95), cover(850, 895, 752, 785, 95), cover(1395, 1470, 750, 785, 95),
      windowSpot(1128, 1180, 612, 705, 95), windowSpot(8, 48, 430, 525, 95), windowSpot(5, 48, 630, 740, 95),
      // the bridge, far across the water
      cover(3090, 3185, 703, 732, 62), cover(3225, 3310, 675, 732, 62), cover(4010, 4100, 702, 732, 62),
      cover(4315, 4405, 683, 732, 62), cover(4635, 4725, 700, 732, 62),
    ],
    streets: [{ feet: 785, man: 95, from: 0, to: 1500 }, { feet: 732, man: 62, from: 1560, to: 5000 }],
  },
]
