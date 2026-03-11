import { describe, expect, it } from 'vitest';
import { flatToTreeData } from '@/utils/handle-function/FlatToTreeData';

describe('FlatToTreeData', () => {
  const option = {
    keyField: 'id',
    titleField: 'name',
    parentKeyField: 'parentId',
    parentTitleField: 'parentName',
  };

  it('应该将扁平数据转换为树结构', () => {
    const flatData = [
      { id: '1', name: '节点1', parentId: null, parentName: null },
      { id: '2', name: '节点2', parentId: '1', parentName: '节点1' },
      { id: '3', name: '节点3', parentId: '1', parentName: '节点1' },
      { id: '4', name: '节点4', parentId: '2', parentName: '节点2' },
    ];

    const tree = flatToTreeData(flatData, option);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].id).toBe('2');
    expect(tree[0].children[1].id).toBe('3');
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe('4');
  });

  it('应该正确处理子节点先于父节点出现的情况', () => {
    const flatData = [
      { id: '4', name: '节点4', parentId: '2', parentName: '节点2' },
      { id: '2', name: '节点2', parentId: '1', parentName: '节点1' },
      { id: '3', name: '节点3', parentId: '1', parentName: '节点1' },
      { id: '1', name: '节点1', parentId: null, parentName: null },
    ];

    const tree = flatToTreeData(flatData, option);

    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].id).toBe('2');
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe('4');
  });

  it('应该返回空数组当输入为空', () => {
    expect(flatToTreeData([], option)).toEqual([]);
  });

  it('应该返回空数组当 option 为空', () => {
    const flatData = [
      { id: '1', name: '节点1', parentId: null },
    ];
    expect(flatToTreeData(flatData, {} as any)).toEqual([]);
  });

  it('应该正确处理没有根节点的情况（所有节点都有父节点，但父节点不存在于数据中）', () => {
    const flatData = [
      { id: '2', name: '节点2', parentId: '1', parentName: '节点1' },
      { id: '3', name: '节点3', parentId: '1', parentName: '节点1' },
      { id: '4', name: '节点4', parentId: '2', parentName: '节点2' },
    ];

    const tree = flatToTreeData(flatData, option);

    // 父节点 1 不存在，所以会被自动创建
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('1');
    expect(tree[0].name).toBe('节点1'); // 父节点名称会使用 parentName
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].id).toBe('2');
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe('4');
  });

  it('应该正确处理多级嵌套', () => {
    const flatData = [
      { id: '1', name: '一级节点', parentId: null, parentName: null },
      { id: '2', name: '二级节点1', parentId: '1', parentName: '一级节点' },
      { id: '3', name: '二级节点2', parentId: '1', parentName: '一级节点' },
      { id: '4', name: '三级节点1', parentId: '2', parentName: '二级节点1' },
      { id: '5', name: '三级节点2', parentId: '2', parentName: '二级节点1' },
      { id: '6', name: '四级节点1', parentId: '4', parentName: '三级节点1' },
      { id: '7', name: '四级节点2', parentId: '4', parentName: '三级节点1' },
    ];

    const tree = flatToTreeData(flatData, option);

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].children).toHaveLength(2);
    expect(tree[0].children[0].children[0].children).toHaveLength(2);
  });

  it('应该正确处理多个根节点', () => {
    const flatData = [
      { id: '1', name: '根节点1', parentId: null },
      { id: '2', name: '根节点2', parentId: null },
      { id: '3', name: '子节点1', parentId: '1' },
      { id: '4', name: '子节点2', parentId: '2' },
    ];

    const tree = flatToTreeData(flatData, option);

    expect(tree).toHaveLength(2);
    expect(tree[0].id).toBe('1');
    expect(tree[1].id).toBe('2');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[1].children).toHaveLength(1);
  });
});
