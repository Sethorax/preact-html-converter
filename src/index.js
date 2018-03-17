const {h} = require('preact');
const htmlParser = require('parse5');
const convert = require('react-attr-converter');

const NODE_TYPE_TEXT = '#text';
const NODE_TYPE_COMMENT = '#comment';

const components = {};

const convertStylesToObject = styleString => {
	const styles = styleString.split(';').reduce((obj, styleDeclaration) => {
		if (styleDeclaration) {
			const parts = styleDeclaration.split(':');
			const key = parts[0].trim();
			const keyArray = Array.from(key);

			Array.from(key).forEach((char, index) => {
				if (char === '-') {
					keyArray[index + 1] = keyArray[index + 1].toUpperCase();
					keyArray[index] = null;
				}
			});

			obj[keyArray.join('')] = parts[1];
		}

		return obj;
	}, {});

	return styles;
};

const convertAttributes = (attrs, key) => {
	return attrs.reduce((result, attr) => {
		const attrName = convert(attr.name);

		result[attrName] = (attrName === 'style') ? convertStylesToObject(attr.value) : attr.value;

		return result;
	}, {key});
};

const convertNode = (node, key) => {
	if (node.nodeName === NODE_TYPE_TEXT) {
		return node.value;
	}

	if (node.nodeName === NODE_TYPE_COMMENT) {
		return node.value;
	}

	const attributes = convertAttributes(node.attrs, key);
	const tagName = (Object.prototype.hasOwnProperty.call(components, node.nodeName)) ? components[node.nodeName] : node.tagName;

	if (node.childNodes.length === 0) {
		return h(tagName, attributes);
	}

	const children = node.childNodes.map(convertNode);
	return h(tagName, attributes, children);
};

const traverse = rootNode => {
	const nodeTree = rootNode.childNodes.map(convertNode);

	return (nodeTree.length === 1) ? nodeTree[0] : nodeTree;
};

function PreactHTMLConverter() {}

PreactHTMLConverter.prototype.registerComponent = (name, componentClass) => {
	components[name] = componentClass;
};

PreactHTMLConverter.prototype.convert = htmlString => {
	if (typeof htmlString !== 'string') {
		return null;
	}

	const html = htmlParser.parseFragment(htmlString);

	if (html.childNodes.length > 0) {
		return traverse(html);
	}

	return null;
};

PreactHTMLConverter.prototype.convertStatic = htmlString => {
	if (typeof htmlString !== 'string') {
		return null;
	}

	const html = htmlParser.parseFragment(htmlString);

	if (html.childNodes.length > 0) {
		let rootNode;

		if (html.childNodes.length === 1) {
			const node = html.childNodes[0];
			rootNode = h(node.nodeName, Object.assign({
				dangerouslySetInnerHTML: {
					__html: htmlParser.serialize(node)
				}
			}, convertAttributes(node.attrs, 0)));
		} else {
			rootNode = h('div', {dangerouslySetInnerHTML: {__html: htmlString}});
		}

		return rootNode;
	}

	return null;
};

module.exports = PreactHTMLConverter;
