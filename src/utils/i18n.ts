const zh = {
  app: {
    title: 'PlantMarker - 植物位置标注工具',
    statusScale: '缩放',
    statusAnnotations: '标注数',
    statusMode: '模式',
    modeDraw: '绘制',
    modeSelect: '选择',
  },
  canvas: {
    hintsTitle: '操作说明',
    pan: '中键按住拖拽，或 Ctrl+左键拖拽：平移画布',
    zoom: '滚轮：以指针为中心缩放',
    selectMode: '选择模式：左键点选标注',
    drawStroke: '绘制模式：按住左键拖动画出区域，松手完成',
    drawPan: '绘制模式下 Shift+左键拖拽：平移画布',
    pointMode: '绘制模式：双击依次放点，再双击起点闭合多边形',
    keys: 'Ctrl+Z 撤销 · Del/Backspace 删除 · 1-9 选对象 · Esc 取消选择',
    autosave: '标注自动保存至当前图片文件夹内的 .plantmarker-annotations.json，下次打开同一文件夹会自动恢复',
    hintsCollapse: '收起',
    hintsClose: '关闭',
    hintsShow: '显示操作说明',
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
    hideCompleted: '隐藏已标注',
  },
  plantList: {
    title: '对象名称',
    noPlants: '未加载对象名称',
    addPlaceholder: '添加对象名称...',
    searchPlaceholder: '搜索对象名称...',
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
