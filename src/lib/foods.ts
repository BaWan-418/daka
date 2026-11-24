import type { FoodGroup } from './types';

export interface FoodItem {
  id: string;
  name: string;
  portion: string;
  /** 每份热量 */
  kcal: number;
  group: FoodGroup;
  categoryId: string | null;
  custom?: boolean;
}

// 常见食物的估算热量（每份）。数值是常见参考值，可以在「手动填写」里按实际情况改。
export const BUILTIN_FOODS: FoodItem[] = [
  // 主食
  { id: 'b-rice', name: '米饭', portion: '1 碗 150 g', kcal: 174, group: 'staple', categoryId: null },
  { id: 'b-brownrice', name: '糙米饭', portion: '1 碗 150 g', kcal: 167, group: 'staple', categoryId: null },
  { id: 'b-mantou', name: '馒头', portion: '1 个 100 g', kcal: 223, group: 'staple', categoryId: null },
  { id: 'b-bun', name: '菜包子', portion: '1 个 80 g', kcal: 160, group: 'staple', categoryId: null },
  { id: 'b-wholewheat', name: '全麦面包', portion: '1 片 35 g', kcal: 85, group: 'staple', categoryId: null },
  { id: 'b-oats', name: '燕麦片', portion: '40 g（干）', kcal: 156, group: 'staple', categoryId: null },
  { id: 'b-noodle', name: '面条', portion: '1 碗 熟 250 g', kcal: 280, group: 'staple', categoryId: null },
  { id: 'b-porridge', name: '杂粮粥', portion: '1 碗 300 g', kcal: 140, group: 'staple', categoryId: null },
  { id: 'b-corn', name: '玉米', portion: '1 根（中）', kcal: 120, group: 'staple', categoryId: null },
  { id: 'b-sweetpotato', name: '红薯', portion: '1 个 200 g', kcal: 172, group: 'staple', categoryId: null },
  { id: 'b-potato', name: '土豆', portion: '1 个 200 g', kcal: 154, group: 'staple', categoryId: null },

  // 蛋白质
  { id: 'b-chicken', name: '鸡胸肉（熟）', portion: '100 g', kcal: 165, group: 'protein', categoryId: null },
  { id: 'b-chickenleg', name: '鸡腿（去皮·熟）', portion: '100 g', kcal: 180, group: 'protein', categoryId: null },
  { id: 'b-egg', name: '水煮蛋', portion: '1 个', kcal: 75, group: 'protein', categoryId: null },
  { id: 'b-beef', name: '瘦牛肉（熟）', portion: '100 g', kcal: 180, group: 'protein', categoryId: null },
  { id: 'b-salmon', name: '三文鱼', portion: '100 g', kcal: 208, group: 'protein', categoryId: null },
  { id: 'b-cod', name: '鳕鱼', portion: '100 g', kcal: 100, group: 'protein', categoryId: null },
  { id: 'b-shrimp', name: '水煮虾仁', portion: '100 g', kcal: 99, group: 'protein', categoryId: null },
  { id: 'b-tofu', name: '豆腐', portion: '100 g', kcal: 90, group: 'protein', categoryId: null },
  { id: 'b-milk', name: '全脂牛奶', portion: '250 ml', kcal: 160, group: 'protein', categoryId: null },
  { id: 'b-skimmilk', name: '脱脂牛奶', portion: '250 ml', kcal: 85, group: 'protein', categoryId: null },
  { id: 'b-yogurt', name: '无糖酸奶', portion: '150 g', kcal: 100, group: 'protein', categoryId: null },
  { id: 'b-soymilk', name: '无糖豆浆', portion: '250 ml', kcal: 83, group: 'protein', categoryId: null },
  { id: 'b-whey', name: '蛋白粉', portion: '1 勺 30 g', kcal: 120, group: 'protein', categoryId: null },

  // 蔬果
  { id: 'b-stirveg', name: '清炒时蔬（少油）', portion: '1 份 200 g', kcal: 100, group: 'veg', categoryId: null },
  { id: 'b-boiledveg', name: '水煮 / 凉拌蔬菜', portion: '1 份 200 g', kcal: 50, group: 'veg', categoryId: null },
  { id: 'b-broccoli', name: '西兰花', portion: '200 g', kcal: 70, group: 'veg', categoryId: null },
  { id: 'b-tomato', name: '番茄', portion: '1 个 150 g', kcal: 30, group: 'veg', categoryId: null },
  { id: 'b-cucumber', name: '黄瓜', portion: '1 根 200 g', kcal: 30, group: 'veg', categoryId: null },
  { id: 'b-apple', name: '苹果', portion: '1 个 200 g', kcal: 104, group: 'veg', categoryId: null },
  { id: 'b-banana', name: '香蕉', portion: '1 根', kcal: 105, group: 'veg', categoryId: null },
  { id: 'b-orange', name: '橙子', portion: '1 个', kcal: 70, group: 'veg', categoryId: null },
  { id: 'b-grape', name: '葡萄', portion: '100 g', kcal: 69, group: 'veg', categoryId: null },
  { id: 'b-nuts', name: '坚果', portion: '1 小把 25 g', kcal: 150, group: 'other', categoryId: null },
  { id: 'b-avocado', name: '牛油果', portion: '半个', kcal: 115, group: 'other', categoryId: null },

  // 违禁类
  { id: 'b-friedchicken', name: '炸鸡', portion: '1 块 约 100 g', kcal: 290, group: 'protein', categoryId: 'fried' },
  { id: 'b-fries', name: '薯条', portion: '中份', kcal: 340, group: 'staple', categoryId: 'fried' },
  { id: 'b-burger', name: '汉堡', portion: '1 个', kcal: 500, group: 'staple', categoryId: 'fried' },
  { id: 'b-skewer', name: '烤串（羊肉）', portion: '1 串', kcal: 90, group: 'protein', categoryId: 'bbq' },
  { id: 'b-bbq', name: '烤肉', portion: '1 份 200 g', kcal: 500, group: 'protein', categoryId: 'bbq' },
  { id: 'b-hotpot', name: '火锅', portion: '1 顿', kcal: 1200, group: 'other', categoryId: 'hotpot' },
  { id: 'b-malatang', name: '麻辣烫', portion: '1 份', kcal: 700, group: 'other', categoryId: 'hotpot' },
  { id: 'b-xiangguo', name: '麻辣香锅', portion: '1 份', kcal: 1000, group: 'other', categoryId: 'oily' },
  { id: 'b-disanxian', name: '地三鲜', portion: '1 份', kcal: 600, group: 'veg', categoryId: 'oily' },
  { id: 'b-hongshaorou', name: '红烧肉', portion: '1 份 150 g', kcal: 600, group: 'protein', categoryId: 'oily' },
  { id: 'b-milktea', name: '奶茶（全糖）', portion: '中杯 500 ml', kcal: 400, group: 'other', categoryId: 'sugary' },
  { id: 'b-cola', name: '可乐', portion: '1 罐 330 ml', kcal: 140, group: 'other', categoryId: 'sugary' },
  { id: 'b-juice', name: '果汁饮料', portion: '1 瓶 500 ml', kcal: 220, group: 'other', categoryId: 'sugary' },
  { id: 'b-cake', name: '蛋糕', portion: '1 块 100 g', kcal: 350, group: 'other', categoryId: 'dessert' },
  { id: 'b-icecream', name: '冰淇淋', portion: '1 个', kcal: 200, group: 'other', categoryId: 'dessert' },
  { id: 'b-instantnoodle', name: '方便面', portion: '1 包', kcal: 470, group: 'staple', categoryId: 'processed' },
  { id: 'b-chips', name: '薯片', portion: '1 包 70 g', kcal: 380, group: 'other', categoryId: 'processed' },
  { id: 'b-sausage', name: '火腿肠', portion: '1 根 50 g', kcal: 150, group: 'protein', categoryId: 'processed' },
];

export const WORKOUT_TYPES = ['力量训练', '跑步', '有氧', '骑行', '游泳', '球类', '瑜伽 / 拉伸', '其他'];
