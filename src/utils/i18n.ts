const zh = {
  app: {
    title: 'PlantMarker - 植物位置标注工具',
    statusScale: '缩放',
    statusAnnotations: '标注数',
    statusMode: '模式',
    modeDraw: '绘制',
    modeSelect: '选择',
    shortcuts: '快捷键: Ctrl+Z 撤销 | Del 删除 | 1-9 选择植物',
  },
  toolbar: {
    folder: '文件夹',
    plants: '植物',
    draw: '绘制',
    drawing: '绘制中',
  },
  imageList: {
    title: '图片列表',
    noImages: '未加载图片',
    annotated: '已标注',
  },
  plantList: {
    title: '植物名称',
    noPlants: '未加载植物名称',
    addPlaceholder: '添加植物名称...',
  },
  annotation: {
    title: '标注信息',
    current: '当前标注',
    selectAnnotation: '请选择一个标注',
    plant: '植物',
    points: '点数',
    color: '颜色',
    delete: '删除',
    list: '标注列表',
    simplifyTolerance: '简化阈值',
  },
  export: {
    title: '导出',
    exportJson: '导出 JSON',
    exportJsonl: '批量导出 JSONL',
    clearCurrent: '清空当前',
    status: '状态',
    totalImages: '总图片数',
    annotated: '已标注',
    currentAnnotations: '当前标注',
    confirmClear: '确定清空当前图片的所有标注？',
  },
  empty: {
    selectFolder: '选择文件夹和图片开始标注',
  },
}

export type I18nKeys = typeof zh

const messages: Record<string, I18nKeys> = {
  zh,
}

let currentLang = 'zh'

export function t(path: string): string {
  const keys = path.split('.')
  let result: any = messages[currentLang]
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return path
    }
  }
  return typeof result === 'string' ? result : path
}

export function setLang(lang: string) {
  if (lang in messages) {
    currentLang = lang
  }
}

export function getLang() {
  return currentLang
}
