import { BarChart3, LayoutList, Trophy, User } from 'lucide-react'
import type { Platform } from '@/types'

export const ITEMS_PER_PAGE = 20
export const SM2_INTERVALS = [1, 3, 7, 14, 30, 90] as const

export const CF_RATING_COLORS = [
  { max: 1199, color: '#808080', label: 'Newbie' },
  { max: 1399, color: '#008000', label: 'Pupil' },
  { max: 1599, color: '#03a89e', label: 'Specialist' },
  { max: 1899, color: '#0000ff', label: 'Expert' },
  { max: 2099, color: '#aa00aa', label: 'Candidate Master' },
  { max: 2399, color: '#ff8c00', label: 'Master' },
  { max: 2599, color: '#ff0000', label: 'International Master' },
  { max: 2999, color: '#ff0000', label: 'Grandmaster' },
  { max: Number.POSITIVE_INFINITY, color: '#ff0000', label: 'Legendary' },
] as const

export const CURATED_LISTS = {
  blind75: [1, 11, 15, 19, 20, 21, 23, 33, 39, 48, 49, 53, 54, 55, 56, 57, 62, 70, 73, 76, 79, 91, 98, 100, 101, 102, 104, 105, 121, 124, 125, 128, 133, 139, 141, 143, 152, 153, 190, 191, 198, 200, 206, 207, 208, 211, 212, 213, 217, 226, 230, 235, 236, 238, 242, 252, 253, 261, 268, 269, 271, 295, 297, 300, 322, 323, 338, 347, 371, 417, 424, 435, 572, 647, 1143],
  neetcode150: [1, 2, 3, 4, 5, 10, 11, 15, 17, 19, 20, 21, 22, 23, 25, 33, 36, 39, 40, 42, 43, 45, 46, 48, 49, 51, 53, 54, 55, 56, 57, 62, 70, 72, 73, 74, 76, 78, 79, 84, 90, 91, 97, 98, 100, 101, 102, 104, 105, 106, 110, 115, 121, 124, 125, 127, 128, 130, 131, 133, 134, 136, 138, 139, 141, 143, 146, 150, 152, 153, 155, 167, 190, 191, 198, 199, 200, 202, 206, 207, 208, 210, 211, 212, 213, 215, 217, 226, 230, 235, 236, 238, 239, 242, 252, 253, 261, 268, 269, 271, 286, 287, 295, 297, 300, 309, 312, 322, 323, 329, 332, 338, 347, 355, 371, 416, 417, 424, 435, 494, 518, 543, 560, 567, 572, 621, 647, 678, 684, 695, 703, 704, 739, 743, 746, 763, 778, 787, 846, 853, 875, 953, 973, 981, 994, 1046, 1143, 1448, 1584, 1851, 1899, 2013],
  striver_sde: [1, 2, 3, 4, 8, 13, 14, 15, 18, 19, 20, 21, 23, 25, 26, 28, 31, 33, 37, 38, 39, 40, 42, 46, 48, 50, 51, 52, 53, 54, 56, 60, 61, 62, 64, 72, 73, 74, 75, 78, 84, 88, 90, 94, 98, 99, 101, 102, 103, 104, 105, 106, 108, 110, 114, 116, 118, 121, 124, 128, 131, 133, 138, 141, 142, 144, 145, 146, 151, 155, 160, 165, 169, 173, 200, 206, 207, 208, 210, 215, 222, 225, 229, 230, 232, 234, 235, 236, 237, 239, 242, 273, 287, 295, 297, 300, 322, 416, 460, 485, 493, 496, 503, 540, 543, 653, 662, 703, 733, 785, 863, 876, 901, 987, 994, 1008],
  lc_top_150: [1, 2, 3, 11, 12, 13, 14, 15, 17, 19, 20, 21, 22, 23, 25, 26, 27, 28, 30, 33, 34, 35, 36, 38, 39, 42, 45, 46, 48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 61, 63, 64, 66, 67, 68, 69, 70, 71, 72, 73, 74, 76, 77, 79, 80, 82, 86, 88, 92, 97, 98, 100, 101, 102, 103, 104, 105, 106, 112, 114, 117, 120, 121, 122, 123, 124, 125, 127, 128, 129, 130, 133, 134, 135, 136, 137, 138, 139, 141, 146, 148, 149, 150, 151, 153, 155, 162, 167, 169, 172, 173, 188, 189, 190, 191, 198, 199, 200, 201, 202, 205, 207, 208, 209, 210, 211, 212, 215, 219, 221, 222, 224, 226, 228, 230, 236, 238, 242, 274, 289, 290, 295, 300, 322, 373, 380, 383, 392, 399, 427, 433, 452, 502, 530, 637, 909, 918],
  striver_cp_sheet: ['263_A', '110_A', '281_A', '236_A', '112_A', '282_A', '158_A', '160_A', '69_A', '58_A', '96_A', '122_A', '479_A', '546_A', '617_A', '791_A', '977_A', '1030_A', '705_A', '136_A', '266_B', '59_A', '271_A', '467_A', '116_A', '41_A', '677_A', '734_A', '266_A', '61_A', '486_A', '200_B', '155_A', '144_A', '141_A', '443_A', '520_A', '785_A', '996_A', '231_A', '71_A', '4_A'],
  cf_a2oj_800: ['263_A', '110_A', '281_A', '236_A', '112_A', '282_A', '158_A', '160_A', '69_A', '58_A', '96_A', '122_A', '479_A', '546_A', '617_A', '791_A', '977_A', '1030_A', '705_A', '136_A', '266_B', '59_A', '271_A', '467_A', '116_A', '41_A', '677_A', '734_A', '266_A', '61_A', '486_A', '200_B', '155_A', '144_A', '141_A', '443_A', '520_A', '785_A', '996_A', '231_A', '71_A', '4_A', '263_B', '339_A', '118_A', '131_A', '230_A', '469_A', '472_A', '581_A'],
  cf_a2oj_1200: ['4_C', '489_C', '459_B', '25_B', '363_B', '368_B', '431_C', '580_C', '276_C', '466_C', '401_C', '339_C', '352_B', '279_B', '285_C', '166_A', '349_A', '149_A', '414_B', '217_A', '350_A', '347_B', '441_C', '371_C', '478_C', '385_C', '115_A', '103_B', '330_B', '265_B', '242_B', '377_A', '445_B', '339_D', '474_B', '489_B', '456_A', '451_B', '514_A', '514_B', '515_C', '519_B', '519_C', '520_B', '522_A', '525_A', '535_B', '538_B', '545_C', '545_D'],
  ac_typical90: ['typical90_a', 'typical90_b', 'typical90_c', 'typical90_d', 'typical90_e', 'typical90_f', 'typical90_g', 'typical90_h', 'typical90_i', 'typical90_j', 'typical90_k', 'typical90_l', 'typical90_m', 'typical90_n', 'typical90_o', 'typical90_p', 'typical90_q', 'typical90_r', 'typical90_s', 'typical90_t', 'typical90_u', 'typical90_v', 'typical90_w', 'typical90_x', 'typical90_y', 'typical90_z', 'typical90_aa', 'typical90_ab', 'typical90_ac', 'typical90_ad', 'typical90_ae', 'typical90_af', 'typical90_ag', 'typical90_ah', 'typical90_ai', 'typical90_aj', 'typical90_ak', 'typical90_al', 'typical90_am', 'typical90_an', 'typical90_ao', 'typical90_ap', 'typical90_aq', 'typical90_ar', 'typical90_as', 'typical90_at', 'typical90_au', 'typical90_av', 'typical90_aw', 'typical90_ax', 'typical90_ay', 'typical90_az', 'typical90_ba', 'typical90_bb', 'typical90_bc', 'typical90_bd', 'typical90_be', 'typical90_bf', 'typical90_bg', 'typical90_bh', 'typical90_bi', 'typical90_bj', 'typical90_bk', 'typical90_bl', 'typical90_bm', 'typical90_bn', 'typical90_bo', 'typical90_bp', 'typical90_bq', 'typical90_br', 'typical90_bs', 'typical90_bt', 'typical90_bu', 'typical90_bv', 'typical90_bw', 'typical90_bx', 'typical90_by', 'typical90_bz', 'typical90_ca', 'typical90_cb', 'typical90_cc', 'typical90_cd', 'typical90_ce', 'typical90_cf', 'typical90_cg', 'typical90_ch', 'typical90_ci', 'typical90_cj', 'typical90_ck', 'typical90_cl'],
  ac_edu_dp: ['dp_a', 'dp_b', 'dp_c', 'dp_d', 'dp_e', 'dp_f', 'dp_g', 'dp_h', 'dp_i', 'dp_j', 'dp_k', 'dp_l', 'dp_m', 'dp_n', 'dp_o', 'dp_p', 'dp_q', 'dp_r', 'dp_s', 'dp_t', 'dp_u', 'dp_v', 'dp_w', 'dp_x', 'dp_y', 'dp_z'],
  ac_beginner: ['practice_1', 'abc086_a', 'abc081_a', 'abc081_b', 'abc087_b', 'abc083_b', 'abc088_b', 'abc085_b', 'abc085_c', 'abc049_c', 'abc086_c'],
} as const

export const CURATED_LOOKUPS = Object.fromEntries(
  Object.entries(CURATED_LISTS).map(([key, value]) => [key, new Set(value.map(String))]),
) as Record<keyof typeof CURATED_LISTS, Set<string>>

export const CURATED_OPTIONS: Record<Platform, Array<{ value: string; label: string }>> = {
  lc: [
    { value: '', label: 'All Problems' },
    { value: 'blind75', label: 'Blind 75' },
    { value: 'neetcode150', label: 'NeetCode 150' },
    { value: 'striver_sde', label: 'Striver SDE' },
    { value: 'lc_top_150', label: 'Top 150' },
  ],
  cf: [
    { value: '', label: 'All Problems' },
    { value: 'cf_a2oj_800', label: 'A2OJ 800' },
    { value: 'cf_a2oj_1200', label: 'A2OJ 1200' },
    { value: 'striver_cp_sheet', label: 'Striver CP' },
  ],
  ac: [
    { value: '', label: 'All Problems' },
    { value: 'ac_typical90', label: 'Typical 90' },
    { value: 'ac_edu_dp', label: 'Edu DP' },
    { value: 'ac_beginner', label: 'Beginner Series' },
  ],
}

export const NAV_ITEMS = [
  { label: 'Problems', to: '/tracker/lc', icon: LayoutList },
  { label: 'Profile', to: '/profile/lc', icon: User },
  { label: 'Insights', to: '/insights/lc', icon: BarChart3 },
  { label: 'Contests', to: '/contests/cf', icon: Trophy },
] as const
