/* @flow */

import React, { Component, PropTypes } from 'react';
import ReactNative from 'react-native';
import NotificationCenterItem from './NotificationCenterItem';
import PageEmpty from './PageEmpty';
import PageLoading from './PageLoading';
import type { Note } from '../../../lib/schemaTypes';

const {
	ListView,
} = ReactNative;

type Props = {
	dismissNote: Function;
	onNavigation: Function;
	data: Array<Note | { type: 'loading' } | { type: 'failed' }>;
}

type State = {
	dataSource: ListView.DataSource
}

export default class NotificationCenter extends Component<void, Props, State> {
	static propTypes = {
		dismissNote: PropTypes.func.isRequired,
		onNavigation: PropTypes.func.isRequired,
		data: PropTypes.arrayOf(PropTypes.object).isRequired,
	};

	state: State = {
		dataSource: new ListView.DataSource({
			rowHasChanged: (r1, r2) => r1 !== r2
		})
	};

	componentWillMount() {
		this.setState({
			dataSource: this.state.dataSource.cloneWithRows(this.props.data)
		});
	}

	componentWillReceiveProps(nextProps: Props) {
		this.setState({
			dataSource: this.state.dataSource.cloneWithRows(nextProps.data)
		});
	}

	_renderRow: Function = (note: Note) => (
		<NotificationCenterItem
			key={note.id}
			note={note}
			onNavigation={this.props.onNavigation}
			dismissNote={this.props.dismissNote}
		/>
	);

	render() {
		const { data } = this.props;

		if (data.length === 0) {
			return <PageEmpty label='No new notifications' image='cool' />;
		}

		if (data.length === 1) {
			if (this.props.data[0] === 'missing') {
				return <PageLoading />;
			}

			if (data[0] === 'failed') {
				return <PageEmpty label='Failed to load notifications' image='sad' />;
			}
		}

		return (
			<ListView
				dataSource={this.state.dataSource}
				renderRow={this._renderRow}
			/>
		);
	}
}
