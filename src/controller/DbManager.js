import realm from '../db/Realm';

class DbManager {
  constructor(schema, primaryKey) {
    this.schema = schema;
    this.primaryKey = primaryKey;
  }

  /**
   * 写入单条数据
   * @param {Object} data 单条数据
   * @param {String} updateMode 写入方式
   */
  create(data, updateMode = 'modified') {
    realm.write(this.schema, data, updateMode);
  }

  /**
   * 写入多条数据
   * @param {Array} list 多条数据列表
   * @param {String} updateMode 写入方式
   */
  createAll(list, updateMode = 'modified') {
    realm.writeAll(this.schema, list, updateMode);
  }

  /**
   * 依据主键更新，常用于增量更新
   * @param {String} primaryKey 单条数据主键
   * @param {Object} data 单条数据
   * @param {String} updateMode 写入方式
   */
  update(primaryKey, data, updateMode = 'modified') {
    const finalData = { [this.primaryKey]: primaryKey, ...data };
    realm.write(this.schema, finalData, updateMode);
  }

  /**
   * 更新本地单条数据，无差别全量更新
   * @param {Object} data 单条数据
   * @param {String} updateMode 写入方式
   */
  updateWhole(data, updateMode = 'modified') {
    realm.writeAll(this.schema, data, updateMode);
  }

  /**
   * 更新本地多条数据
   * @param {Array} list 多条数据列表
   * @param {String} updateMode 写入方式
   */
  updateAll(list, updateMode = 'modified') {
    this.createAll(list, updateMode);
  }

  // 通过id删除本地数据
  deleteById(primaryKey) {
    try {
      realm.realmIns.write(() => {
        const deleteObj = this.queryById(primaryKey);
        if (deleteObj) {
          realm.realmIns.delete(deleteObj);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  // 通过id查询本地数据
  queryById(primaryKey) {
    try {
      const list = realm.realmIns.objects(this.schema);
      const data = list.filtered(`${this.primaryKey} == "${primaryKey}"`)[0];
      if (data) {
        return data;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  // 获取本地文件列表
  getList(sortedAttr = 'createTime') {
    try {
      const list = realm.realmIns.objects(this.schema).sorted(sortedAttr, true);
      if (list) {
        return list;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  // groupBy本地文件列表
  groupBy(groupAttr, value, sortedAttr) {
    try {
      let list = realm.realmIns.objects(this.schema).filtered(`${groupAttr} == "${value}"`);
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

  // groupBy PrimaryKey 本地文件列表
  groupById(value, sortedAttr) {
    return this.groupBy(this.primaryKey, value, sortedAttr);
  }

  // 获取转化后的本地数据
  // eslint-disable-next-line class-methods-use-this
  getObject(realmObject, filterFun) {
    const obj = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const key in realmObject) {
      if (filterFun && filterFun(key)) {
        obj[key] = realmObject[key];
      }
    }
    return obj;
  }
}

// 笔触点数据库操作对象
class Strokes extends DbManager {
  constructor() {
    super('Strokes', 'strokeId');
  }

  groudByNotebookId(notebookId, pageNum) {
    // return this.groupBy('notebookId', value, sortedAttr);
    try {
      const list = realm.realmIns.objects(this.schema).filtered(`notebookId == "${notebookId}" && n==${pageNum}`);
      /* if (sortedAttr) {
        list = list.sorted(sortedAttr, true);
      } */

      if (list) {
        return list;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
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
      let list = realm.realmIns.objects(this.schema).filtered(`notebookId == "${notebookId}" && active==${active}`);
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
  Strokes: new Strokes(),
  Notebook: new Notebook(),

};
