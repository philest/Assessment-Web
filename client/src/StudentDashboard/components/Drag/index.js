import React, { Component } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// fake data generator
// const getItems = count =>
// 	Array.from({ length: count }, (v, k) => k).map(k => ({
// 		id: `item-${k}`,
// 		content: `item ${k}`
// 	}));

const alphabet = "abcdefghijklmnopqrstuvwxyz";

const getItems = (count, version) =>
	Array.from({ length: count }, (v, k) => k).map(k => ({
		id: `${alphabet[k]}`,
		content: `${alphabet[k]}`
	}));

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
	const result = Array.from(list);
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);

	return result;
};

const insertAtIndex = (list, itemId, index) => {
	let newArr = [];
	for (let i = 0; i < list.length; i++) {
		if (i !== index) {
			newArr.push(list[i]);
		} else {
			newArr.push({
				id: `${itemId}-${Math.random()}`,
				content: `${itemId}`
			});
			newArr.push(list[i]);
		}
	}

	if (list.length === 0 || index === list.length) {
		newArr.push({
			id: `${itemId}-${Math.random()}`,
			content: `${itemId}`
		});
	}

	return newArr;
};

const remove = (list, itemId) => {
	let newArr = [];
	for (let i = 0; i < list.length; i++) {
		if (list[i].id !== itemId) {
			newArr.push(list[i]);
		}
	}
	return newArr;
};

const grid = 8;

const getItemStyle = (draggableStyle, isDragging) => ({
	// some basic styles to make the items look a bit nicer
	userSelect: "none",
	padding: grid * 2,
	margin: `0 ${grid}px 0 0`,
	width: 50,
	fontSize: 50,
	color: "white",
	// color: white,
	//    fontSize: 30,
	//    background: 'none';

	// change background colour if dragging
	// background: isDragging ? "lightgreen" : "grey",

	// styles we need to apply on draggables
	...draggableStyle
});

const getListStyle = (isAlphabet, isDraggingOver) => {
	if (isAlphabet) {
		return {
			// background: isDraggingOver ? "lightblue" : "lightgray",
			padding: grid,
			minWidth: 800,
			minHeight: 70,
			maxWidth: 500,
			minHeight: 70,
			margin: "0 auto"
		};
	} else {
		return {
			background: isDraggingOver ? "lightblue" : "lightgray",
			padding: grid,
			minWidth: 400,
			maxWidth: 400,
			margin: "0 auto",
			minHeight: 70
		};
	}
};

export default class Drag extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			items: getItems(0, 1),
			items2: getItems(26, 2)
		};
		this.onDragEnd = this.onDragEnd.bind(this);
	}

	onDragEnd(result) {
		if (!result.destination && result.source.droppableId === "droppable") {
			console.log("here1");

			console.log("this.state.items: ", this.state.items);
			let itemsHolder = this.state.items;

			itemsHolder = remove(itemsHolder, result.draggableId);
			this.setState({ items: itemsHolder });
			return;
		}

		// dropped outside the list
		if (!result.destination) {
			console.log("here2: ", result);
			console.log(
				"result.source.droppableId: ",
				result.source.droppableId
			);

			return;
		}

		if (
			result.source.droppableId === "droppable" &&
			result.destination.droppableId === "droppable2"
		) {
			console.log("here2");

			console.log("this.state.items: ", this.state.items);
			let itemsHolder = this.state.items;

			itemsHolder = remove(itemsHolder, result.draggableId);
			this.setState({ items: itemsHolder });
			return;
		}

		console.log("result: ", result);

		if (
			result.source.droppableId === "droppable2" &&
			result.destination.droppableId === "droppable"
		) {
			console.log("this.state.items: ", this.state.items);
			let itemsHolder = this.state.items;

			itemsHolder = insertAtIndex(
				itemsHolder,
				result.draggableId,
				result.destination.index
			);

			this.setState({ items: itemsHolder });
		}

		if (
			result.destination.droppableId === "droppable" &&
			result.source.droppableId === "droppable"
		) {
			const items = reorder(
				this.state.items,
				result.source.index,
				result.destination.index
			);

			this.setState({
				items
			});
		}

		// if (result.destination.droppableId === "droppable2") {
		// 	const items2 = reorder(
		// 		this.state.items2,
		// 		result.source.index,
		// 		result.destination.index
		// 	);

		// 	this.setState({
		// 		items2
		// 	});
		// }
	}

	// Normally you would want to split things out into separate components.
	// But in this example everything is just done in one place for simplicity
	render() {
		return (
			<DragDropContext onDragEnd={this.onDragEnd}>
				<div>
					<Droppable droppableId="droppable" direction="horizontal">
						{(provided, snapshot) => (
							<div
								ref={provided.innerRef}
								style={getListStyle(
									false,
									snapshot.isDraggingOver
								)}
							>
								{this.state.items.map(item => (
									<Draggable
										key={item.id}
										draggableId={item.id}
									>
										{(provided, snapshot) => (
											<div
												style={{
													display: "inline-block"
												}}
											>
												<div
													ref={provided.innerRef}
													style={getItemStyle(
														provided.draggableStyle,
														snapshot.isDragging
													)}
													{...provided.dragHandleProps}
												>
													{item.content}
												</div>
												{provided.placeholder}
											</div>
										)}
									</Draggable>
								))}
								{provided.placeholder}
							</div>
						)}
					</Droppable>

					<div />
					<br />

					<Droppable droppableId="droppable2" direction="horizontal">
						{(provided, snapshot) => (
							<div
								ref={provided.innerRef}
								style={getListStyle(
									true,
									snapshot.isDraggingOver
								)}
							>
								{this.state.items2.map(item => (
									<Draggable
										key={item.id}
										draggableId={item.id}
									>
										{(provided, snapshot) => (
											<div
												style={{
													display: "inline-block"
												}}
											>
												<div
													ref={provided.innerRef}
													style={getItemStyle(
														provided.draggableStyle,
														snapshot.isDragging
													)}
													{...provided.dragHandleProps}
												>
													{item.content}
												</div>
												{provided.placeholder}
											</div>
										)}
									</Draggable>
								))}
								{provided.placeholder}
							</div>
						)}
					</Droppable>
				</div>
			</DragDropContext>
		);
	}
}
