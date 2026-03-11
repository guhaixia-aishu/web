import _ from 'lodash'

type FlatTreeDataOption = {
  keyField: string
  titleField: string
  parentKeyField: string // 父节点的key字段
  parentTitleField: string // 父节点的title字段
}

/**
 * 扁平数据转树结构
 */
export const flatToTreeData = (flatTreeData: any[], option: FlatTreeDataOption) => {
  if (!_.isEmpty(option)) {
    const { keyField, titleField, parentKeyField, parentTitleField } = option
    const cloneFlatTreeData = _.cloneDeep(flatTreeData)
    const cacheMap: Record<string, any> = {}

    // 第一次遍历：创建所有节点并放入缓存
    for (let i = 0; i < cloneFlatTreeData.length; i++) {
      const item = cloneFlatTreeData[i]
      const nodeKey = item[keyField] as string
      cacheMap[nodeKey] = {
        ...item,
        children: cacheMap[nodeKey]?.children ?? [],
      }
    }

    const treeDataSource: any[] = []
    // 第二次遍历：建立父子关系
    for (let i = 0; i < cloneFlatTreeData.length; i++) {
      const item = cloneFlatTreeData[i]
      const nodeKey = item[keyField] as string
      const parentNodeKey = item[parentKeyField]
      const parentNodeTitle = item[parentTitleField]

      const currentNode = cacheMap[nodeKey]

      if (!parentNodeKey) {
        // 根节点
        treeDataSource.push(currentNode)
      } else {
        // 有父节点
        if (!cacheMap[parentNodeKey]) {
          // 父节点不存在于原数据中，自动创建
          cacheMap[parentNodeKey] = {
            [keyField]: parentNodeKey,
            [titleField]: parentNodeTitle,
            children: [],
          }
          treeDataSource.push(cacheMap[parentNodeKey])
        }
        cacheMap[parentNodeKey].children.push(currentNode)
      }
    }

    return treeDataSource
  }
  return []
}
