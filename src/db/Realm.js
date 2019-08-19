import db from './localDB';
// const Realm = require('realm');

// Realm.defaultPath = '/Users/bs007/Desktop/www/bs/js_group/owl_scanner_rn_realm/default.realm';

const realm = {
  init() {
    this.realmIns = db.getDB();
  },

  getDB() {
    const realmIns = db.getDB();
    this.realmIns = realmIns;
    return realmIns;
  },

  /**
   * 创建一般化写入方式，接受回调函数，回调函数接受realm实例
   * 本方法可用于增量更新，在回调函数中操作realmObject等对象进行更新
   * @param {Function} callback 回调函数
   */
  writeInner(callback) {
    try {
      const realmIns = this.getDB();
      realmIns.write(() => {
        if (typeof callback === 'function') {
          callback(realmIns);
        }
      });
    } catch (e) {
      console.error(e);
    }
  },

  write(schema, data, updateMode) {
    this.writeInner((realmIns) => {
      realmIns.create(schema, data, updateMode);
    });
  },

  // 批量写入
  writeAll(schema, list, updateMode) {
    this.writeInner((realmIns) => {
      for (let i = 0, len = list.length; i < len; i += 1) {
        const data = list[i];
        realmIns.create(schema, data, updateMode);
      }
    });
  },

  delete(realmObject) {
    this.writeInner((realmIns) => {
      realmIns.delete(realmObject);
    });
  },

  clear() {
    this.writeInner((realmIns) => {
      realmIns.deleteAll();
    });
  },

};

export default realm;
