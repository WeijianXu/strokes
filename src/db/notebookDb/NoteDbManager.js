import realm from '../Realm';
import DbManager from '../DbManager';
import { randomWord } from '../../utils/Number';

const DBUtil = {

  maxStringLen: 0.1 * 1024 * 1024, // realm 最大为 16MB

  checkOutSize(strokes) {
    return strokes.length > this.maxStringLen;
  },

  /**
   * 切分笔触点数据
   * > 特别强调：英文字母肯定lenght和字节数都一样：都是１
   * > 笔触点中不包含特殊字符，即字符只在 \u0000-\u00ff 之间
   * @param {String|Array} strokes 笔触点数据
   */
  spliceStrokes(strokes) {
    let strokesStr = '';
    let strokesArray = [];
    if (Object.prototype.toString.call(strokes) === '[object Array]') {
      strokesStr = JSON.stringify(strokes);
      strokesArray = strokes;
    } else if (typeof strokes === 'string' && strokes.slice(0, 1) === '[') {
      // 确保 original 是字符串数组
      strokesStr = strokes;
      strokesArray = JSON.parse(strokes);
    } else {
      // 否则数据格式不对，终止
      console.warn('strokes of notes have error format');
    }

    if (strokesStr.length < this.maxStringLen) {
      return [strokesStr];
    }
    try {
      const piece = Math.ceil(strokesStr.length / this.maxStringLen);
      const strokesList = [];
      for (let i = 0; i < piece; i += 1) {
        strokesList.push(JSON.stringify(strokesArray.splice(0, this.maxStringLen)));
      }
      return strokesList;
    } catch (error) {
      return [];
    }
  },

  /**
   * 将笔触点转化成可以追加到数据库中的形式
   * 1. 当前追加到笔触点ID可以容纳下 strokesStr，则追加上去
   * 2. 否则，切分 strokesStr，生成多行数据，在进行后面操作
   * @param {String} notebookId 笔记本ID
   * @param {String} pageNum 页码
   * @param {String} strokesStr 即将要追加的笔触点字符串数组
   */
  transferStrokes(notebookId, pageNum, strokesStr) {
    const strokesDataList = [];
    const strokesArray = DBUtil.spliceStrokes(strokesStr);
    for (let j = 0; j < strokesArray.length; j += 1) {
      strokesDataList.push({
        strokeId: DBUtil.createIdByNbIdAndPN(notebookId, pageNum),
        notebookId,
        pageNum,
        strokes: strokesArray[j],
        updateOn: new Date().getTime(),
      });
    }
    return strokesDataList;
  },

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

  joinStrokesArray(strokesArray = []) {
    let newStrokes = '[]';
    for (let i = 0, len = strokesArray.length; i < len; i += 1) {
      newStrokes = this.appendStrokesTo(strokesArray[i], newStrokes);
    }
    return newStrokes;
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
   * 根据notebookId、pageNum查询出所有本页数据（含切分出来的数据）
   * @param {Strign} notebookId 笔记本ID
   * @param {Number} pageNum 页码
   */
  queryByNbIdAndPN(notebookId, pageNum) {
    const pageN = pageNum && !Number.isNaN(pageNum) ? Number(pageNum) : 0;
    let strokeList = this.query(`notebookId == "${notebookId}" && pageNum==${pageN}`);
    if (!strokeList) {
      return null;
    }
    // 升序，保证数据顺序正确
    strokeList = strokeList.sorted('updateOn', false);
    const strokesArray = strokeList.map(note => note.strokes);

    return {
      notebookId, pageNum, strokes: DBUtil.joinStrokesArray(strokesArray),
    };
  }

  getNewestStrokes(notebookId, pageNum) {
    const pageN = pageNum && !Number.isNaN(pageNum) ? Number(pageNum) : 0;
    let strokeList = this.query(`notebookId == "${notebookId}" && pageNum==${pageN}`);
    if (!strokeList) {
      return null;
    }
    // 降序，取最新的那条数据
    strokeList = strokeList.sorted('updateOn', true);
    // 只有最新变更的 stroke 才有可能可以继续追加数据
    return strokeList[0];
  }

  /**
   * 分配唯一的笔触模式，以便后续替换操作
   * 1. 本地已存在该模式，使用，否则新建
   * 2. 只返回主键
   * @param {String} notebookId 笔记本ID
   * @param {String} pageNum 页码
   * @param {String} appendingStrokesLen 即将要追加的字符串长度
   */
  assignSchema(notebookId, pageNum, appendingStrokesLen = 0) {
    const strokesDataList = this.getNewestStrokes(notebookId, pageNum);
    if (strokesDataList) {
      const { strokeId, strokes } = strokesDataList;
      // 即将要追加的字符串长度 + 当前操作的数据对象 < max
      if (appendingStrokesLen + strokes.length < DBUtil.maxStringLen) {
        return strokeId;
      }
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
    const strokesStr = DBUtil.formatStrokes(strokes);
    if (!DBUtil.checkOutSize(strokesStr)) {
      const strokeId = DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
      this.create({
        strokeId,
        notebookId,
        pageNum,
        strokes: strokesStr,
        updateOn: new Date().getTime(),
      });
    } else {
      // strokes 切分出来存储
      const strokesDataList = DBUtil.transferStrokes(notebookId, pageNum, strokes);
      this.createAll(strokesDataList);
    }
  }

  /**
   * 根据 notes 信息，批量插入到数据库中
   * @param {String} notebookId 笔记本ID
   * @param {Array} notes 完整的原始数据，形式 [{ pageNum: 0, strokes: []}]
   */
  createFromNotes(notebookId, notes = []) {
    //
    const strokesList = [];
    for (let i = 0, len = notes.length; i < len; i += 1) {
      const { pageNum, strokes } = notes[i];
      const strokesStr = DBUtil.formatStrokes(strokes);
      if (!DBUtil.checkOutSize(strokesStr)) {
        const strokeId = DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
        strokesList.push({
          strokeId,
          notebookId,
          pageNum,
          strokes: strokesStr,
          updateOn: new Date().getTime(),
        });
      } else {
        // 追加的 strokes 切分出来存储
        strokesList.push(...DBUtil.transferStrokes(notebookId, pageNum, strokes));
      }
    }
    this.createAll(strokesList);
  }

  /**
   * 根据 notes 信息，批量替换数据库中数据
   * 1. 数据库中不存在，将会生成
   * @param {String} notebookId 笔记本ID
   * @param {Array} notes 完整的原始数据，形式 [{ pageNum: 0, strokes: []}]
   */
  batchInsteadOf(notebookId, notes = []) {
    const strokesList = [];
    for (let i = 0, len = notes.length; i < len; i += 1) {
      const { pageNum, strokes } = notes[i];
      const strokesStr = DBUtil.formatStrokes(strokes);
      if (!DBUtil.checkOutSize(strokesStr)) {
        const strokeId = this.assignSchema(notebookId, pageNum, strokesStr.length);
        strokesList.push({
          strokeId,
          notebookId,
          pageNum,
          strokes: strokesStr,
          updateOn: new Date().getTime(),
        });
      } else {
        // 追加的 strokes 切分出来存储
        strokesList.push(...DBUtil.transferStrokes(notebookId, pageNum, strokes));
      }
    }
    this.updateAll(strokesList);
  }

  /**
   * 根据 notes 信息，批量插入到数据库中
   * @param {Array} notes 完整的原始数据，形式 [{ pageNum: 0, strokes: []}]
   */
  appendFromNotes(notebookId, notes = []) {
    //
    const strokesDataList = [];
    for (let i = 0, len = notes.length; i < len; i += 1) {
      const { pageNum, strokes } = notes[i];
      const strokesList = this.getNewestStrokes(notebookId, pageNum);
      // 当前笔迹当前页面存在，进行追加
      let strokeId = DBUtil.createIdByNbIdAndPN(notebookId, pageNum);
      let originalStrokes = '[]';
      if (strokesList) {
        const { strokeId: orignalStrokeId, strokes: original } = strokesList;
        strokeId = orignalStrokeId;
        originalStrokes = original;
      }

      const strokesStr = DBUtil.appendStrokesTo(strokes, originalStrokes);
      if (!DBUtil.checkOutSize(strokesStr)) {
        strokesDataList.push({
          strokeId,
          notebookId,
          pageNum,
          strokes: strokesStr,
          updateOn: new Date().getTime(),
        });
      } else {
        // 追加的 strokes 切分出来存储
        strokesDataList.push(...DBUtil.transferStrokes(notebookId, pageNum, strokes));
      }
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
    const strokesList = this.getNewestStrokes(notebookId, pageNum);
    if (!strokesList) {
      this.createAt(notebookId, pageNum, strokes);
      return;
    }
    const { strokeId, strokes: original } = strokesList;
    const finalStrokes = DBUtil.appendStrokesTo(strokes, original);
    if (!DBUtil.checkOutSize(finalStrokes)) {
      this.update(strokeId, { strokes: finalStrokes });
    } else {
      // 追加的 strokes 切分出来存储
      const strokesDataList = DBUtil.transferStrokes(notebookId, pageNum, strokes);
      this.updateAll(strokesDataList);
    }
  }
}

// 笔触点备份
class StrokesListBackup extends DbManager {
  constructor() {
    super('StrokesListBackup', 'backupId');
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
