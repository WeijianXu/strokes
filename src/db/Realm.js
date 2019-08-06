import RNFS from 'react-native-fs';
import {
  StrokesSchema, NotebookSchema, NoteSchema,
} from './Schema';

const Realm = require('realm');

Realm.defaultPath = '/Users/bs007/Desktop/www/bs/js_group/owl_scanner_rn_realm/default.realm';

const realm = {
  init() {
    try {
      this.realmIns = new Realm({ schema: [StrokesSchema, NotebookSchema, NoteSchema] });
    } catch (e) {
      /* const config = {
        path: Realm.defaultPath,
      }; */
      // Realm.deleteFile(config); // 该方法会出现删除不了的情况
      this.delFile(Realm.defaultPath);
      this.init();
    }
    console.log('realm db file path:', this.realmIns.path);
  },

  write(schema, data, updateMode) {
    try {
      this.realmIns.write(() => {
        this.realmIns.create(schema, data, updateMode);
      });
    } catch (e) {
      console.error(e);
    }
  },

  // 批量写入
  writeAll(schema, list, updateMode) {
    try {
      this.realmIns.write(() => {
        for (let i = 0, len = list.length; i < len; i += 1) {
          const data = list[i];
          this.realmIns.create(schema, data, updateMode);
        }
      });
    } catch (e) {
      console.error(e);
    }
  },

  delFile(filePath) {
    RNFS.unlink(filePath);
  },

  clear() {
    this.realmIns.write(() => {
      this.realmIns.deleteAll();
    });
  },
};

export default realm;
