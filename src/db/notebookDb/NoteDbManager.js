import realm from '../Realm';
import DbManager from '../DbManager';
import { randomWord } from '../../utils/Number';

const DBUtil = {

  formatStrokes(strokes) {
    if (Object.prototype.toString.call(strokes) === '[object Array]') {
      return JSON.stringify(strokes);
    } if (typeof strokes === 'string' && strokes.slice(0, 1) === '[') {
      // 确保 original 是字符串数组
      return strokes;
    }
    // 否则数据格式不对，终止
    console.warn('strokes of notes have error format');
    return '[]';
  },

  appendStrokesTo(currStrokes, originalStrokes) {
    // 确保 original 是字符串数组
    const newStrokes = this.formatStrokes(currStrokes);
    // 如果原始数据为空，直接返回当前点数据
    if (!originalStrokes || originalStrokes === '[]') {
      return newStrokes;
    }
    return `${originalStrokes.replace(/\]$/, '')},${newStrokes.replace(/^\[/, '')}`;
  },

  createIdByNbIdAndPN(notebookId, pageNum) {
    return notebookId.slice(0, 4) + pageNum + randomWord(8, 8, 8);
  },

};

// 笔触点数据库操作对象 废弃
/* class Strokes extends DbManager {
  constructor() {
    super('Strokes', 'strokeId');
  }

  groupByNotebookId(notebookId, pageNum) {
    // return this.groupBy('notebookId', value, sortedAttr);
    try {
      const list = realm.getDB().objects(this.schema).filtered(`notebookId == "${notebookId}" && n==${pageNum}`);

      if (list) {
        return list;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  syncCloud(notebookId, pageNum, cloud) {
    try {
      realm.getDB().write(() => {
        for (let i = 0, len = cloud.length; i < len; i += 1) {
          const data = {
            ...cloud[i],
            notebookId,
            strokeId: notebookId.substring(notebookId.length - 4) + pageNum + randomWord(8, 8, 8),
          };
          this.getDB().create(this.schema, data);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
} */

// 笔触点数据库操作对象
class StrokesList extends DbManager {
  constructor() {
    super('StrokesList', 'strokeId');
  }

  /**
   * 查询当前笔记本所有笔迹信息
   * @param {String} notebookId 笔记本ID
   */
  groupByNotebookId(notebookId) {
    // return this.groupBy('notebookId', value, sortedAttr);
    const list = this.query(`notebookId == "${notebookId}"`);
    if (list) {
      return list;
    }
    return [];
  }

  /**
   * 根据notebookId、pageNum唯一确定一条数据
   * @param {Strign} notebookId 笔记本ID
   * @param {Number} pageNum 页码
   */
  queryByNbIdAndPN(notebookId, pageNum) {
    const pageN = pageNum && !Number.isNaN(pageNum) ? Number(pageNum) : 0;
    const stroke = this.query(`notebookId == "${notebookId}" && pageNum==${pageN}`);
    if (!stroke) {
      return null;
    }
    return stroke[0];
  }

  /**
   * 分配唯一的笔触模式，以便后续替换操作
   * 1. 本方法基础在 notebookId, pageNum 唯一确定一个 strokeId
   * 2. 本地已存在该模式，使用，否则新建
   * 3. 只返回主键
   * @param {String} notebookId 笔记本ID
   * @param {String} pageNum 页码
   */
  assignSchema(notebookId, pageNum) {
    const strokesDataList = this.queryByNbIdAndPN(notebookId, pageNum);
    if (strokesDataList) {
      const { strokeId } = strokesDataList;
      return strokeId;
    }
    return DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
  }

  /**
   * 创建笔触点列表数据，由本方法创建对应ID信息
   * @param {String} notebookId 笔记本ID
   * @param {String} pageNum 页码
   * @param {String|Array} strokes 笔触点数据，字符串形式或Array形式
   */
  createAt(notebookId, pageNum = 1, strokes) {
    const strokeId = DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
    this.create({
      strokeId, notebookId, pageNum, strokes: DBUtil.formatStrokes(strokes),
    });
  }

  /**
   * 根据 notes 信息，批量插入到数据库中
   * 确保每一条数据都是在互斥的，不会出现同一页数据
   * @param {String} notebookId 笔记本ID
   * @param {Array} notes 完整的原始数据，形式 [{ pageNum: 0, strokes: []}]
   */
  createFromNotes(notebookId, notes = []) {
    //
    const strokesList = [];
    for (let i = 0, len = notes.length; i < len; i += 1) {
      const { pageNum, strokes } = notes[i];
      const strokeId = DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
      const strokesStr = DBUtil.formatStrokes(strokes);
      strokesList.push({
        strokeId,
        notebookId,
        pageNum,
        strokes: strokesStr,
      });
    }
    this.createAll(strokesList);
  }

  /**
   * 根据 notes 信息，批量替换数据库中数据
   * 1. 确保每一条数据都是在互斥的，不会出现同一页数据
   * 2. 数据库中不存在，将会生成
   * @param {String} notebookId 笔记本ID
   * @param {Array} notes 完整的原始数据，形式 [{ pageNum: 0, strokes: []}]
   */
  batchInsteadOf(notebookId, notes = []) {
    const strokesList = [];
    for (let i = 0, len = notes.length; i < len; i += 1) {
      const { pageNum, strokes } = notes[i];
      const strokeId = this.assignSchema(notebookId, pageNum);
      const strokesStr = DBUtil.formatStrokes(strokes);
      strokesList.push({
        strokeId,
        notebookId,
        pageNum,
        strokes: strokesStr,
      });
    }
    this.updateAll(strokesList);
  }

  /**
   * 根据 notes 信息，批量插入到数据库中
   * 确保每一条数据都是在互斥的，不会出现同一页数据
   * @param {Array} notes 完整的原始数据，形式 [{ pageNum: 0, strokes: []}]
   */
  appendFromNotes(notebookId, notes = []) {
    //
    const strokesDataList = [];
    for (let i = 0, len = notes.length; i < len; i += 1) {
      const { pageNum, strokes } = notes[i];
      const strokesList = this.queryByNbIdAndPN(notebookId, pageNum);
      // 当前笔迹当前页面存在，进行追加
      let strokeId = DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
      let originalStrokes = '[]';
      if (strokesList) {
        const { strokeId: orignalStrokeId, strokes: original } = strokesList;
        strokeId = orignalStrokeId;
        originalStrokes = original;
      }
      const strokesStr = DBUtil.appendStrokesTo(strokes, originalStrokes);
      strokesDataList.push({
        strokeId,
        notebookId,
        pageNum,
        strokes: strokesStr,
      });
    }
    this.updateAll(strokesDataList);
  }

  /**
   * 往当前存在的笔记本某页上，追加笔触点数据
   * @param {String} notebookId 笔记本ID
   * @param {String} pageNum 页码
   * @param {String|Array} strokes 笔触点数据，字符串形式或Array形式
   */
  appendStrokes(notebookId, pageNum, strokes) {
    const strokesList = this.queryByNbIdAndPN(notebookId, pageNum);
    if (!strokesList) {
      return;
    }
    const { strokeId, strokes: original } = strokesList;
    const finalStrokes = DBUtil.appendStrokesTo(strokes, original);
    this.update(strokeId, { strokes: finalStrokes });
  }
}

// 笔触点备份
class StrokesListBackup extends DbManager {
  constructor() {
    super('StrokesListBackup', 'backupId');
  }

  /**
   * 分配唯一的笔触模式，以便后续替换操作
   * 1. 本方法基础在 notebookId, pageNum 唯一确定一个 strokeId
   * 2. 本地已存在该模式，使用，否则新建
   * 3. 只返回主键
   * @param {String} notebookId 笔记本ID
   * @param {String} pageNum 页码
   */
  assignSchema(notebookId, pageNum) {
    const strokesDataList = this.queryByNbIdAndPN(notebookId, pageNum);
    if (strokesDataList) {
      const { strokeId } = strokesDataList;
      return strokeId;
    }
    return DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
  }

  /**
   * 查询当前笔记本所有笔迹信息
   * @param {String} notebookId 笔记本ID
   */
  groupByNotebookId(notebookId) {
    // return this.groupBy('notebookId', value, sortedAttr);
    const list = this.query(`notebookId == "${notebookId}"`);
    if (list) {
      return list;
    }
    return [];
  }

  /**
   * 创建笔触点列表数据，由本方法创建对应ID信息
   * @param {String} notebookId 笔记本ID
   * @param {String} pageNum 页码
   * @param {String|Array} strokes 笔触点数据，字符串形式或Array形式
   */
  createAt(notebookId, pageNum = 1, strokes) {
    const backupId = DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
    this.create({
      backupId, notebookId, pageNum, strokes: DBUtil.formatStrokes(strokes),
    });
  }

  // 通过id删除本地数据
  deleteByNotebookId(notebookId) {
    const deletingList = this.groupByNotebookId(notebookId);
    if (deletingList) {
      realm.delete(deletingList);
    }
  }

  // 通过id删除本地数据
  deleteByBatchId(batchId) {
    const deletingList = this.groupBy('batchId', batchId);
    if (deletingList) {
      realm.delete(deletingList);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _generateBatchId() {
    return randomWord(8, 8, 8);
  }

  /**
   * 根据 notes 信息，批量插入到数据库中
   * 确保每一条数据都是在互斥的，不会出现同一页数据
   * @param {String} notebookId 笔记本ID
   * @param {Array} notes 完整的原始数据，形式 [{ pageNum: 0, strokes: []}]
   */
  createFromNotes(notebookId, notes = []) {
    //
    const strokesListBackup = [];
    const batchId = this._generateBatchId();
    for (let i = 0, len = notes.length; i < len; i += 1) {
      const { pageNum, strokes } = notes[i];
      const backupId = DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
      const strokesStr = DBUtil.formatStrokes(strokes);
      strokesListBackup.push({
        backupId,
        batchId,
        notebookId,
        pageNum,
        strokes: strokesStr,
      });
    }
    this.createAll(strokesListBackup);
    return batchId;
  }


  /**
   * 根据 notes 信息，批量替换数据库中数据
   * 1. 确保每一条数据都是在互斥的，不会出现同一页数据
   * 2. 数据库中不存在，将会生成
   * @param {String} notebookId 笔记本ID
   * @param {Array} notes 完整的原始数据，形式 [{ pageNum: 0, strokes: []}]
   */
  batchInsteadOf(notebookId, notes = []) {
    const strokesList = [];
    const batchId = this._generateBatchId();
    for (let i = 0, len = notes.length; i < len; i += 1) {
      const { pageNum, strokes } = notes[i];
      const backupId = this.assignSchema(notebookId, pageNum);
      const strokesStr = DBUtil.formatStrokes(strokes);
      strokesList.push({
        backupId,
        batchId,
        notebookId,
        pageNum,
        strokes: strokesStr,
      });
    }
    this.updateAll(strokesList);
    return batchId;
  }
}

// 笔触点数据库操作对象
class Notebook extends DbManager {
  constructor() {
    super('Notebook', 'notebookId');
  }

  /**
   * 按照主键、active，进行归并，并按照 sortedAttr 进行排序
   * @param {String} notebookId 主键
   * @param {Boolean} active 是否激活
   * @param {String} sortedAttr 排序字段，默认 createOn
   */
  groudByIdAndActive(notebookId, active = false, sortedAttr = 'createOn') {
    // return this.groupBy('notebookId', value, sortedAttr);
    try {
      let list = realm.getDB().objects(this.schema).filtered(`notebookId == "${notebookId}" && active==${active}`);
      if (sortedAttr) {
        list = list.sorted(sortedAttr, true);
      }

      if (list) {
        return list;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  // 获取完整信息
  getWholeData(notebookId) {
    const notebookRealm = this.queryById(notebookId);
    if (!notebookRealm) {
      return {};
    }
    const notebook = this.getObject(notebookRealm, key => key !== 'notes');
    // 获取该笔记本下面的每页信息notes
    notebook.notes = this._transferNotes(notebookRealm.notes);
    return notebook;
  }

  // eslint-disable-next-line class-methods-use-this
  _transferNotes(notes) {
    const n = [];
    for (let i = 0, len = notes.length; i < len; i += 1) {
      const { pageNum, previewImg, previewThumbImg } = notes[i];
      n.push({
        pageNum, previewImg, previewThumbImg,
      });
    }
    return n;
  }

  // 只获取 notes 数组列表
  getNotes(notebookId) {
    const notebookRealm = this.queryById(notebookId);
    if (!notebookRealm) {
      return [];
    }
    // 处理 notes
    return this._transferNotes(notebookRealm.notes);
  }
}

export default {
  // Strokes: new Strokes(),
  Notebook: new Notebook(),
  StrokesList: new StrokesList(),
  StrokesListBackup: new StrokesListBackup(),
};
