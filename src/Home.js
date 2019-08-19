import React, { Component } from 'react';
import { View, Text, Button, TextInput } from 'react-native';

// import strokes from './assets/strokes.json';
import Db from './db/notebookDb/NoteDbManager';
import realm from './db/Realm';

const oneLineData = require('./assets/oneLine') ;

export default class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			createDuration: 0,
			queryDuration: 0,
			dataCount: 0,
			notebookId: '',
			pageNum: '1',
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
		for (let i = 0; i < 1; i++) {
			const id = 1; // const id = Math.floor((Math.random() * 100));
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

			for (let j = 1; j < 2; j++) {
				const pageNum = j;
				notes.push({
					pageNum,
					previewImg: `${pageNum}-previewImg.png`,
					previewThumbImg: `${pageNum}-previewThumbImg.png`,
				});
				// 点触笔数据
				// const strokes = [];
				// for (let k = 0, kLen = 1 ; k < kLen; k++) {
				// 	strokes.push({
				// 		pageNum,
				// 		strokes: oneLineData
				// 	});
				// }
				// Db.StrokesList.createFromNotes(notebookId, strokes);
				// Db.StrokesList.appendStrokes(notebookId, pageNum, oneLineData);
				Db.StrokesList.createAt(notebookId, pageNum, oneLineData);
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
		const { notebookId, pageNum } = this.state;
		const begin = new Date().getTime();
		const strokesList = Db.StrokesList.queryByNbIdAndPN(notebookId, Number(pageNum));
		// console.log('strokesList.strokes: ', strokesList.strokes);
		const duration = new Date().getTime() - begin;
		this.setState({
			queryDuration: duration,
			dataCount: strokesList.strokes.length,
			// firstData: strokesList.strokes
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

	queryNotebook = () => {
		const { notebookId } = this.state;
		const begin = new Date().getTime();
		const notebooks = Db.Notebook.getWholeData(notebookId);
		const duration = new Date().getTime() - begin;
		this.setState({
			queryDuration: duration,
			dataCount: notebooks.notes.length,
			firstData: notebooks
		});
	}

	onChangeText = (value) => {
		this.setState({
			notebookId: value,
		});
	}

	onPageNumChange = (value) => {
		this.setState({
			pageNum: value,
		});
	}

	render() {
		const { createDuration, queryDuration, dataCount, notebookId, pageNum, firstData } = this.state;
		return (
			<View>
				<Text> Home </Text>
				<Button title="生成数据" onPress={this.createData} />
				<Text>{`createDuration: ${createDuration}`}</Text>
				<Text>请输入notebookId：</Text>
				<TextInput value={notebookId} onChangeText={this.onChangeText} style={{ borderWidth: 1, borderColor: '#eee' }}  />
				<Text>请输入pageNum：</Text>
				<TextInput value={pageNum} onChangeText={this.onPageNumChange} style={{ borderWidth: 1, borderColor: '#eee' }}  />
				<Button title="查询Strokes数据" onPress={this.queryData} />
				<Button title="查询Notebook notes数据" onPress={this.queryNotesData} />
				<Button title="查询Notebook数据" onPress={this.queryNotebook} />
				<Text>{`queryDuration: ${queryDuration}`}</Text>
				<Text>{`dataCount: ${dataCount} B ~~ ${(dataCount / 1024 / 1024).toFixed(2)} MB`}</Text>
				<Text>{`firstData: ${JSON.stringify(firstData)}`}</Text>
			</View>
		);
	}
}
