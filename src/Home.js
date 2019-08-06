import React, { Component } from 'react';
import { View, Text, Button, TextInput } from 'react-native';

// import strokes from './assets/strokes.json';
import Db from './controller/DbManager';
import realm from './db/Realm';

export default class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			createDuration: 0,
			queryDuration: 0,
			dataCount: 0,
			notebookId: '',
			firstData: {},
		};

    // realm 实例是否存在
    realm.init();
	}

	componentDidMount() {
		realm.clear()
	}
	
	createData = () => {
		const begin = new Date().getTime();
		const notebooks = [];
		for (let i = 0; i < 5; i++) {
			const id = Math.floor((Math.random() * 100));
			const totalNum = id % 10 > 0 ? id % 10 : 10;
			notebookId = `notebookId_${i}_${id}`;
			const createOn = new Date().getTime();
			const notebook = {
				notebookId,
				name: notebookId,
				coverImg: `${notebookId}-coverImg.png`,
				usedNum: 1,
				totalNum: totalNum,
				createOn,
				updateOn: createOn,
				active: !!(id % 2),
			};
			const notes = [];

			for (let j = 0; j < totalNum; j++) {
				const pageNum = j;
				notes.push({
					pageNum,
					previewImg: `${pageNum}-previewImg.png`,
					previewThumbImg: `${pageNum}-previewThumbImg.png`,
				});
				// 点触笔数据
				const strokes = [];
				for (let k = 0, kLen = 100 * id; k < kLen; k++) {
					strokes.push({
						strokeId: `strokeId_${i}_${j}_${k}_${id}`,
						// data: nodeList,
						notebookId,
						x: id,
						y: k,
						// p: { type: 'int', default: 0 }, // 压力
						n: pageNum, // 页码
						t: new Date().getTime(), // 创建时间
					});
				}
				Db.Strokes.createAll(strokes);
			}
			notebook.notes = notes;
			notebooks.push(notebook);
		}
		Db.Notebook.createAll(notebooks);

		const duration = new Date().getTime() - begin;
		this.setState({
			createDuration: duration,
			notebookId: notebooks[0].notebookId,
		});
	}

	queryData = () => {
		const { notebookId } = this.state;
		const begin = new Date().getTime();
		const strokes = Db.Strokes.groudByNotebookId(notebookId, 1);
		console.log('====================================');
		console.log('strokes: ', strokes);
		console.log('====================================');
		const list = [];
		let  sum = 0;
		for (let s of strokes) {
			const { x, y, n, p } = s;
			// console.log('s: ', s.x);
			// sum += s.data.length
			list.push({ x, y, n, p })
		}
		/* strokes.forEach(( s, idx) => {
			sum += s.data.length
		}) */
		// console.log('sum: ', sum);
		console.log('sum: ', list.length);
		const duration = new Date().getTime() - begin;
		this.setState({
			queryDuration: duration,
			dataCount: strokes.length,
			firstData: list[0]
		});
	}

	queryNotesData = () => {
		const { notebookId } = this.state;
		const begin = new Date().getTime();
		const notes = Db.Notebook.getNotes(notebookId);
		const duration = new Date().getTime() - begin;
		this.setState({
			queryDuration: duration,
			dataCount: notes.length,
			firstData: notes[0]
		});
	}

	onChangeText = (value) => {
		this.setState({
			notebookId: value,
		});
	}

	render() {
		const { createDuration, queryDuration, dataCount, notebookId, firstData } = this.state;
		return (
			<View>
				<Text> Home </Text>
				<Button title="生成数据" onPress={this.createData} />
				<Text>{`createDuration: ${createDuration}`}</Text>
				<Text>请输入notebookId：</Text>
				<TextInput value={notebookId} onChangeText={this.onChangeText} style={{ borderWidth: 1, borderColor: '#eee' }}  />
				<Button title="查询Strokes数据" onPress={this.queryData} />
				<Button title="查询Notebook notes数据" onPress={this.queryNotesData} />
				<Text>{`queryDuration: ${queryDuration}`}</Text>
				<Text>{`dataCount: ${dataCount}`}</Text>
				<Text>{`firstData: ${JSON.stringify(firstData)}`}</Text>
			</View>
		);
	}
}
