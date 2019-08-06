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
  },
};

export const StrokesSchema = {
  name: 'Strokes',
  primaryKey: 'strokeId',
  properties: {
    strokeId: { type: 'string', indexed: true }, // notebookId编号后4位 + 页码(1-3位) + 8位随机
    notebookId: { type: 'string', default: '', indexed: true },
    x: { type: 'int', default: 0 },
    y: { type: 'int', default: 0 },
    p: { type: 'int', default: 0 }, // 压力
    n: { type: 'int', default: 1 }, // 页码
    t: 'int?', // 创建时间
  },
};
