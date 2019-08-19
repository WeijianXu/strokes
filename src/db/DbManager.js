import realm from './Realm';

export default class DbManager {
  constructor(schema, primaryKey) {
    this.schema = schema;
    this.primaryKey = primaryKey;
  }

  // eslint-disable-next-line class-methods-use-this
  writeInner(callback) {
    realm.writeInner(callback);
  }

  /**
   * 写入单条数据
   * @param {Object} data 单条数据
   * @param {String|Boolean} updateMode 写入方式
   */
  create(data, updateMode = 'modified') {
    realm.write(this.schema, data, updateMode);
  }

  /**
   * 写入多条数据
   * @param {Array} list 多条数据列表
   * @param {String|Boolean} updateMode 写入方式
   */
  createAll(list, updateMode = 'modified') {
    realm.writeAll(this.schema, list, updateMode);
  }

  /**
   * 依据主键更新，常用于增量更新
   * @param {String} primaryKey 单条数据主键
   * @param {Object} data 单条数据
   * @param {String|Boolean} updateMode 写入方式
   */
  update(primaryKey, data, updateMode = 'modified') {
    const finalData = { [this.primaryKey]: primaryKey, ...data };
    realm.write(this.schema, finalData, updateMode);
  }

  /**
   * 更新本地单条数据，无差别全量更新
   * @param {Object} data 单条数据
   * @param {String|Boolean} updateMode 写入方式
   */
  updateWhole(data, updateMode = 'modified') {
    realm.write(this.schema, data, updateMode);
  }

  /**
   * 更新本地多条数据
   * @param {Array} list 多条数据列表
   * @param {String|Boolean} updateMode 写入方式
   */
  updateAll(list, updateMode = 'modified') {
    this.createAll(list, updateMode);
  }

  // 通过id删除本地数据
  // eslint-disable-next-line class-methods-use-this
  delete(deleteObj) {
    if (deleteObj) {
      realm.delete(deleteObj);
    }
  }

  // 通过id删除本地数据
  deleteById(primaryKey) {
    const deleteObj = this.queryById(primaryKey);
    if (deleteObj) {
      realm.delete(deleteObj);
    }
  }

  querySchema() {
    const realmIns = realm.getDB();
    return realmIns.objects(this.schema);
  }

  // 一般查询方法，传入查询语句
  query(querySql) {
    try {
      const list = this.querySchema();
      let data;
      if (querySql) {
        data = list.filtered(querySql);
      }
      if (data) {
        return data;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  // 通过id查询本地数据
  queryById(primaryKey) {
    const data = this.query(`${this.primaryKey} == "${primaryKey}"`);
    if (data) {
      return data[0];
    }
    return null;
  }

  // 获取本地文件列表，所有列表项
  getList(sortedAttr) {
    try {
      let list = realm.getDB().objects(this.schema);
      if (sortedAttr) {
        list = list.sorted(sortedAttr, true);
      }
      if (!list) {
        return [];
      }
      return list;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  // groupBy本地文件列表
  groupBy(groupAttr, value, sortedAttr) {
    let list = this.query(`${groupAttr} == "${value}"`);
    if (!list) {
      return [];
    }
    if (sortedAttr) {
      list = list.sorted(sortedAttr, true);
    }
    return list;
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
