export const NotebookSchema = {
  name: 'Notebook',
  primaryKey: 'notebookId',
  properties: {
    notebookId: { type: 'string', indexed: true },
    name: { type: 'string', default: '' },
    coverImg: 'string?',
    usedNum: { type: 'int', default: 0 },
    totalNum: { type: 'int', default: 0 },
    createOn: { type: 'int', default: 0 },
    updateOn: { type: 'int', default: 0 },
    active: { type: 'bool', default: false },
    notes: { type: 'Note[]', default: [] },
    nextPosition: { type: 'int', default: 0 },
    noteDataUrl: { type: 'string', default: '' },
  },
};

export const NoteSchema = {
  name: 'Note',
  properties: {
    note: {
      type: 'linkingObjects',
      objectType: 'Notebook',
      property: 'notes',
    },
    pageNum: { type: 'int', default: 1 }, // 页码
    previewImg: { type: 'string', default: '' },
    previewThumbImg: { type: 'string', default: '' },
    //
  },
};

// 废弃该schema
export const StrokesSchema = {
  name: 'Strokes',
  primaryKey: 'strokeId',
  properties: {
    strokeId: { type: 'string', indexed: true }, // notebookId编号前4位 + 页码(1-3位) + 8位随机
    notebookId: { type: 'string', default: '', indexed: true },
    x: { type: 'int', default: 0 },
    y: { type: 'int', default: 0 },
    p: { type: 'int', default: 0 }, // 压力
    n: { type: 'int', default: 1 }, // 页码
    a: { type: 'int', default: 1 },
    t: 'int?', // 创建时间
  },
};

export const StrokesListSchema = {
  name: 'StrokesList',
  primaryKey: 'strokeId',
  properties: {
    // strokes: { type: 'Strokes[]', default: [] },
    strokeId: { type: 'string', indexed: true }, // notebookId编号前4位 + 页码(1-3位) + 8位随机
    notebookId: { type: 'string', default: '', indexed: true },
    pageNum: { type: 'int', default: 1 }, // 页码
    updateOn: { type: 'int', default: 0 },
    strokes: { type: 'string', default: '[]' }, // [{ x, y, p, n, a, t }, ...] 见StrokesSchema
  },
};

// 本模式下主要作用：将 StrokesListSchema 中追加失败的点备份到该模式下
// 即外键 notebookId/pageNum 来确定该组数据和 StrokesListSchema 对应
export const StrokesListBackupSchema = {
  name: 'StrokesListBackup',
  primaryKey: 'backupId',
  properties: {
    backupId: { type: 'string', indexed: true }, // notebookId编号前4位 + 页码(1-3位) + 8位随机
    batchId: { type: 'string', indexed: true }, // 当前备份数据的批次，8位随机
    notebookId: { type: 'string', default: '', indexed: true },
    pageNum: { type: 'int', default: 1 }, // 页码
    strokes: { type: 'string', default: '[]' }, // [{ x, y, p, n, a, t }, ...] 见StrokesSchema
  },
};
