/**
 * Генераторы тяжёлых данных для стресс-тестирования компонентов.
 */

export interface ListItem {
  id: number;
  name: string;
  value: number;
  active: boolean;
  tags: string[];
}

/**
 * Генерирует массив из `count` элементов для рендер-бенчмарков.
 * @example generateData(10_000)
 */
export function generateData(count: number): ListItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random() * 1000,
    active: i % 2 === 0,
    tags: [`tag-${i % 5}`, `tag-${i % 3}`],
  }));
}

export interface TreeNode {
  id: number;
  label: string;
  children: TreeNode[];
}

/**
 * Генерирует дерево глубиной `depth`, на каждом уровне по `breadth` узлов.
 */
export function generateTree(depth: number, breadth: number, id = { current: 0 }): TreeNode {
  const node: TreeNode = {
    id: id.current++,
    label: `Node-${id.current}`,
    children: [],
  };
  if (depth > 0) {
    for (let i = 0; i < breadth; i++) {
      node.children.push(generateTree(depth - 1, breadth, id));
    }
  }
  return node;
}
