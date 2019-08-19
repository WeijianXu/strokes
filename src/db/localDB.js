import {
  /* StrokesSchema,  */NotebookSchema, NoteSchema, StrokesListSchema, StrokesListBackupSchema,
} from './notebookDb/Schema';

const Realm = require('realm');
// const { SchemaVersion, Schema, Enum } = require('./LocalDBDefinition.json');
const { delFile } = require('../../utils/File');

// Realm.defaultPath = '/Users/bs007/Desktop/www/bs/js_group/owl_scanner_rn_realm/default.realm';
console.log('realm default path: ', Realm.defaultPath);

const SchemaVersion = 4;

/* let realm = null;
const init = async () => {
  if (realm) {
    realm.close();
  }
  // try {
  realm = await Realm.open({
    schema: Object.values(Schema),
    schemaVersion: SchemaVersion,
    // upgrade migration handler
    // migration: (oldRealm, newRealm) => {
    //   // only apply this change if upgrading to schemaVersion 1
    //   if (oldRealm.schemaVersion < 1) {
    //     // return;
    //     // data upgrade handler
    //     // const oldObjects = oldRealm.objects('Car');
    //     // const newObjects = newRealm.objects('Car');
    //     // // loop through all objects and set the name property in the new schema
    //     // for (let i = 0; i < oldObjects.length; i++) {
    //     //   console.log(oldObjects[i])
    //     //   newObjects[i].abc = oldObjects[i].make + oldObjects[i].model;
    //     // }
    //   }
    // },
  });
  //   return realm;
  // } catch (error) {
  //   // FIXME: 如果出现错误，删除本地的数据库，并重启
  //   await delFile(Realm.defaultPath);
  //   return init();
  // }
}; */
const db = {
  realm: null, // 单例实例，只会创建一次，用在异步 Realm.open 方式上
  realmIns: null, // 单例实例，只会创建一次，用在同步 new Realm  方式上
  realmOptions: {
    schema: [
      /* StrokesSchema,  */NotebookSchema, NoteSchema, StrokesListSchema, StrokesListBackupSchema],
    schemaVersion: SchemaVersion,
    // upgrade migration handler
    // migration: (oldRealm, newRealm) => {
    //   // only apply this change if upgrading to schemaVersion 1
    //   if (oldRealm.schemaVersion < 1) {
    //     // return;
    //     // data upgrade handler
    //     // const oldObjects = oldRealm.objects('Car');
    //     // const newObjects = newRealm.objects('Car');
    //     // // loop through all objects and set the name property in the new schema
    //     // for (let i = 0; i < oldObjects.length; i++) {
    //     //   console.log(oldObjects[i])
    //     //   newObjects[i].abc = oldObjects[i].make + oldObjects[i].model;
    //     // }
    //   }
    // },
  },
  //  不能使用箭头函数，否则this指向错误
  async init() {
    if (this.realm) {
      return this.realm;
    }
    try {
      const realm = await Realm.open(this.realmOptions);
      this.realm = realm;
      return realm;
    } catch (error) {
    // FIXME: 如果出现错误，删除本地的数据库，并重启
      await delFile(Realm.defaultPath);
      return this.init();
    }
  },
  // 异步方式打开realm，避免阻止线程
  async openDB() {
    const realm = await Realm.open(this.realmOptions);
    this.realm = realm;
    return realm;
  },
  getDB() {
    // 当前异步已启动数据库，直接返回
    if (this.realm && !this.realm.isClosed) {
      return this.realm;
    }
    // 当前同步已启动数据库，直接返回
    if (this.realmIns && !this.realmIns.isClosed) {
      return this.realmIns;
    }
    // 否则，同步开启数据库
    this.realmIns = new Realm(this.realmOptions);
    return this.realmIns;
  },
  closeDB() {
    if (this.realm) {
      this.realm.close();
    }
    if (this.realmIns) {
      this.realmIns.close();
    }
  },
  checkIsEmpty() {
    const schemaNames = this.realmOptions.schema.map(schema => schema.name);
    schemaNames.forEach((schema) => {
      const len = this.getDB().objects(schema).length;
      console.log(`check ${schema} is empty: ${len}`);
    });
  },
  // 清空DB所有数据
  clearDB() {
    const realm = this.getDB();
    realm.write(() => {
      // const allDocument = realm.objects('Document');
      realm.deleteAll();
    });
  },
};

export default db;
