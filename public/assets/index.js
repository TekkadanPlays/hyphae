// node_modules/inferno/dist/index.esm.js
var isArray = Array.isArray;
function isStringOrNumber(o) {
  var type = typeof o;
  return type === "string" || type === "number";
}
function isNullOrUndef(o) {
  return o === undefined || o === null;
}
function isInvalid(o) {
  return o === null || o === false || o === true || o === undefined;
}
function isFunction(o) {
  return typeof o === "function";
}
function isString(o) {
  return typeof o === "string";
}
function isNumber(o) {
  return typeof o === "number";
}
function isNull(o) {
  return o === null;
}
function isUndefined(o) {
  return o === undefined;
}
function combineFrom(first, second) {
  var out = {};
  if (first) {
    for (var key in first) {
      out[key] = first[key];
    }
  }
  if (second) {
    for (var _key in second) {
      out[_key] = second[_key];
    }
  }
  return out;
}
function isLinkEventObject(o) {
  return !isNull(o) && typeof o === "object";
}
var EMPTY_OBJ = {};
var Fragment = "$F";
var AnimationQueues = function AnimationQueues2() {
  this.componentDidAppear = [];
  this.componentWillDisappear = [];
  this.componentWillMove = [];
};
function normalizeEventName(name) {
  return name.substring(2).toLowerCase();
}
function appendChild(parentDOM, dom) {
  parentDOM.appendChild(dom);
}
function insertOrAppend(parentDOM, newNode, nextNode) {
  if (isNull(nextNode)) {
    appendChild(parentDOM, newNode);
  } else {
    parentDOM.insertBefore(newNode, nextNode);
  }
}
function documentCreateElement(tag, isSVG) {
  if (isSVG) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }
  return document.createElement(tag);
}
function replaceChild(parentDOM, newDom, lastDom) {
  parentDOM.replaceChild(newDom, lastDom);
}
function removeChild(parentDOM, childNode) {
  parentDOM.removeChild(childNode);
}
function callAll(arrayFn) {
  for (var i = 0;i < arrayFn.length; i++) {
    arrayFn[i]();
  }
}
function findChildVNode(vNode, startEdge, flags) {
  var children = vNode.children;
  if (flags & 4) {
    return children.$LI;
  }
  if (flags & 8192) {
    return vNode.childFlags === 2 ? children : children[startEdge ? 0 : children.length - 1];
  }
  return children;
}
function findDOMFromVNode(vNode, startEdge) {
  var flags;
  while (vNode) {
    flags = vNode.flags;
    if (flags & 1521) {
      return vNode.dom;
    }
    vNode = findChildVNode(vNode, startEdge, flags);
  }
  return null;
}
function callAllAnimationHooks(animationQueue, callback) {
  var animationsLeft = animationQueue.length;
  var fn;
  while ((fn = animationQueue.pop()) !== undefined) {
    fn(function() {
      if (--animationsLeft <= 0 && isFunction(callback)) {
        callback();
      }
    });
  }
}
function callAllMoveAnimationHooks(animationQueue) {
  for (var i = 0;i < animationQueue.length; i++) {
    animationQueue[i].fn();
  }
  for (var _i = 0;_i < animationQueue.length; _i++) {
    var tmp = animationQueue[_i];
    insertOrAppend(tmp.parent, tmp.dom, tmp.next);
  }
  animationQueue.splice(0, animationQueue.length);
}
function clearVNodeDOM(vNode, parentDOM, deferredRemoval) {
  do {
    var flags = vNode.flags;
    if (flags & 1521) {
      if (!deferredRemoval || vNode.dom.parentNode === parentDOM) {
        removeChild(parentDOM, vNode.dom);
      }
      return;
    }
    var children = vNode.children;
    if (flags & 4) {
      vNode = children.$LI;
    }
    if (flags & 8) {
      vNode = children;
    }
    if (flags & 8192) {
      if (vNode.childFlags === 2) {
        vNode = children;
      } else {
        for (var i = 0, len = children.length;i < len; ++i) {
          clearVNodeDOM(children[i], parentDOM, false);
        }
        return;
      }
    }
  } while (vNode);
}
function createDeferComponentClassRemovalCallback(vNode, parentDOM) {
  return function() {
    clearVNodeDOM(vNode, parentDOM, true);
  };
}
function removeVNodeDOM(vNode, parentDOM, animations) {
  if (animations.componentWillDisappear.length > 0) {
    callAllAnimationHooks(animations.componentWillDisappear, createDeferComponentClassRemovalCallback(vNode, parentDOM));
  } else {
    clearVNodeDOM(vNode, parentDOM, false);
  }
}
function addMoveAnimationHook(animations, parentVNode, refOrInstance, dom, parentDOM, nextNode, flags, props) {
  animations.componentWillMove.push({
    dom,
    fn: function fn() {
      if (flags & 4) {
        refOrInstance.componentWillMove(parentVNode, parentDOM, dom);
      } else if (flags & 8) {
        refOrInstance.onComponentWillMove(parentVNode, parentDOM, dom, props);
      }
    },
    next: nextNode,
    parent: parentDOM
  });
}
function moveVNodeDOM(parentVNode, vNode, parentDOM, nextNode, animations) {
  var refOrInstance;
  var instanceProps;
  var instanceFlags = vNode.flags;
  do {
    var flags = vNode.flags;
    if (flags & 1521) {
      if (!isNullOrUndef(refOrInstance) && (isFunction(refOrInstance.componentWillMove) || isFunction(refOrInstance.onComponentWillMove))) {
        addMoveAnimationHook(animations, parentVNode, refOrInstance, vNode.dom, parentDOM, nextNode, instanceFlags, instanceProps);
      } else {
        insertOrAppend(parentDOM, vNode.dom, nextNode);
      }
      return;
    }
    var children = vNode.children;
    if (flags & 4) {
      refOrInstance = vNode.children;
      instanceProps = vNode.props;
      vNode = children.$LI;
    } else if (flags & 8) {
      refOrInstance = vNode.ref;
      instanceProps = vNode.props;
      vNode = children;
    } else if (flags & 8192) {
      if (vNode.childFlags === 2) {
        vNode = children;
      } else {
        for (var i = 0, len = children.length;i < len; ++i) {
          moveVNodeDOM(parentVNode, children[i], parentDOM, nextNode, animations);
        }
        return;
      }
    }
  } while (vNode);
}
function createDerivedState(instance, nextProps, state) {
  if (instance.constructor.getDerivedStateFromProps) {
    return combineFrom(state, instance.constructor.getDerivedStateFromProps(nextProps, state));
  }
  return state;
}
var renderCheck = {
  v: false
};
var options = {
  componentComparator: null,
  createVNode: null,
  renderComplete: null
};
function setTextContent(dom, children) {
  dom.textContent = children;
}
function isLastValueSameLinkEvent(lastValue, nextValue) {
  return isLinkEventObject(lastValue) && lastValue.event === nextValue.event && lastValue.data === nextValue.data;
}
function mergeUnsetProperties(to, from) {
  for (var propName in from) {
    if (isUndefined(to[propName])) {
      to[propName] = from[propName];
    }
  }
  return to;
}
function safeCall1(method, arg1) {
  return !!isFunction(method) && (method(arg1), true);
}
var keyPrefix = "$";
function V(childFlags, children, className, flags, key, props, ref, type) {
  this.childFlags = childFlags;
  this.children = children;
  this.className = className;
  this.dom = null;
  this.flags = flags;
  this.key = key === undefined ? null : key;
  this.props = props === undefined ? null : props;
  this.ref = ref === undefined ? null : ref;
  this.type = type;
}
function createVNode(flags, type, className, children, childFlags, props, key, ref) {
  var childFlag = childFlags === undefined ? 1 : childFlags;
  var vNode = new V(childFlag, children, className, flags, key, props, ref, type);
  if (options.createVNode) {
    options.createVNode(vNode);
  }
  if (childFlag === 0) {
    normalizeChildren(vNode, vNode.children);
  }
  return vNode;
}
function mergeDefaultHooks(flags, type, ref) {
  if (flags & 4) {
    return ref;
  }
  var defaultHooks = (flags & 32768 ? type.render : type).defaultHooks;
  if (isNullOrUndef(defaultHooks)) {
    return ref;
  }
  if (isNullOrUndef(ref)) {
    return defaultHooks;
  }
  return mergeUnsetProperties(ref, defaultHooks);
}
function mergeDefaultProps(flags, type, props) {
  var defaultProps = (flags & 32768 ? type.render : type).defaultProps;
  if (isNullOrUndef(defaultProps)) {
    return props;
  }
  if (isNullOrUndef(props)) {
    return combineFrom(defaultProps, null);
  }
  return mergeUnsetProperties(props, defaultProps);
}
function resolveComponentFlags(flags, type) {
  if (flags & 12) {
    return flags;
  }
  if (type.prototype && type.prototype.render) {
    return 4;
  }
  if (type.render) {
    return 32776;
  }
  return 8;
}
function createComponentVNode(flags, type, props, key, ref) {
  flags = resolveComponentFlags(flags, type);
  var vNode = new V(1, null, null, flags, key, mergeDefaultProps(flags, type, props), mergeDefaultHooks(flags, type, ref), type);
  if (options.createVNode) {
    options.createVNode(vNode);
  }
  return vNode;
}
function createTextVNode(text, key) {
  return new V(1, isNullOrUndef(text) || text === true || text === false ? "" : text, null, 16, key, null, null, null);
}
function createFragment(children, childFlags, key) {
  var fragment = createVNode(8192, 8192, null, children, childFlags, null, key, null);
  switch (fragment.childFlags) {
    case 1:
      fragment.children = createVoidVNode();
      fragment.childFlags = 2;
      break;
    case 16:
      fragment.children = [createTextVNode(children)];
      fragment.childFlags = 4;
      break;
  }
  return fragment;
}
function cloneFragment(vNodeToClone) {
  var oldChildren = vNodeToClone.children;
  var childFlags = vNodeToClone.childFlags;
  return createFragment(childFlags === 2 ? directClone(oldChildren) : oldChildren.map(directClone), childFlags, vNodeToClone.key);
}
function directClone(vNodeToClone) {
  var flags = vNodeToClone.flags & -16385;
  var props = vNodeToClone.props;
  if (flags & 14) {
    if (!isNull(props)) {
      var propsToClone = props;
      props = {};
      for (var key in propsToClone) {
        props[key] = propsToClone[key];
      }
    }
  }
  if ((flags & 8192) === 0) {
    return new V(vNodeToClone.childFlags, vNodeToClone.children, vNodeToClone.className, flags, vNodeToClone.key, props, vNodeToClone.ref, vNodeToClone.type);
  }
  return cloneFragment(vNodeToClone);
}
function createVoidVNode() {
  return createTextVNode("", null);
}
function _normalizeVNodes(nodes, result, index, currentKey) {
  for (var len = nodes.length;index < len; index++) {
    var n = nodes[index];
    if (!isInvalid(n)) {
      var newKey = currentKey + keyPrefix + index;
      if (isArray(n)) {
        _normalizeVNodes(n, result, 0, newKey);
      } else {
        if (isStringOrNumber(n)) {
          n = createTextVNode(n, newKey);
        } else {
          var oldKey = n.key;
          var isPrefixedKey = isString(oldKey) && oldKey[0] === keyPrefix;
          if (n.flags & 81920 || isPrefixedKey) {
            n = directClone(n);
          }
          n.flags |= 65536;
          if (!isPrefixedKey) {
            if (isNull(oldKey)) {
              n.key = newKey;
            } else {
              n.key = currentKey + oldKey;
            }
          } else if (oldKey.substring(0, currentKey.length) !== currentKey) {
            n.key = currentKey + oldKey;
          }
        }
        result.push(n);
      }
    }
  }
}
function getFlagsForElementVnode(type) {
  switch (type) {
    case "svg":
      return 32;
    case "input":
      return 64;
    case "select":
      return 256;
    case "textarea":
      return 128;
    case Fragment:
      return 8192;
    default:
      return 1;
  }
}
function normalizeChildren(vNode, children) {
  var newChildren;
  var newChildFlags = 1;
  if (isInvalid(children)) {
    newChildren = children;
  } else if (isStringOrNumber(children)) {
    newChildFlags = 16;
    newChildren = children;
  } else if (isArray(children)) {
    var len = children.length;
    for (var i = 0;i < len; ++i) {
      var n = children[i];
      if (isInvalid(n) || isArray(n)) {
        newChildren = newChildren || children.slice(0, i);
        _normalizeVNodes(children, newChildren, i, "");
        break;
      } else if (isStringOrNumber(n)) {
        newChildren = newChildren || children.slice(0, i);
        newChildren.push(createTextVNode(n, keyPrefix + i));
      } else {
        var key = n.key;
        var needsCloning = (n.flags & 81920) > 0;
        var isNullKey = isNull(key);
        var isPrefixed = isString(key) && key[0] === keyPrefix;
        if (needsCloning || isNullKey || isPrefixed) {
          newChildren = newChildren || children.slice(0, i);
          if (needsCloning || isPrefixed) {
            n = directClone(n);
          }
          if (isNullKey || isPrefixed) {
            n.key = keyPrefix + i;
          }
          newChildren.push(n);
        } else if (newChildren) {
          newChildren.push(n);
        }
        n.flags |= 65536;
      }
    }
    newChildren = newChildren || children;
    if (newChildren.length === 0) {
      newChildFlags = 1;
    } else {
      newChildFlags = 8;
    }
  } else {
    newChildren = children;
    newChildren.flags |= 65536;
    if (children.flags & 81920) {
      newChildren = directClone(children);
    }
    newChildFlags = 2;
  }
  vNode.children = newChildren;
  vNode.childFlags = newChildFlags;
  return vNode;
}
function normalizeRoot(input) {
  if (isInvalid(input) || isStringOrNumber(input)) {
    return createTextVNode(input, null);
  }
  if (isArray(input)) {
    return createFragment(input, 0, null);
  }
  return input.flags & 16384 ? directClone(input) : input;
}
var xlinkNS = "http://www.w3.org/1999/xlink";
var xmlNS = "http://www.w3.org/XML/1998/namespace";
var namespaces = {
  "xlink:actuate": xlinkNS,
  "xlink:arcrole": xlinkNS,
  "xlink:href": xlinkNS,
  "xlink:role": xlinkNS,
  "xlink:show": xlinkNS,
  "xlink:title": xlinkNS,
  "xlink:type": xlinkNS,
  "xml:base": xmlNS,
  "xml:lang": xmlNS,
  "xml:space": xmlNS
};
function getDelegatedEventObject(v) {
  return {
    onClick: v,
    onDblClick: v,
    onFocusIn: v,
    onFocusOut: v,
    onKeyDown: v,
    onKeyPress: v,
    onKeyUp: v,
    onMouseDown: v,
    onMouseMove: v,
    onMouseUp: v,
    onTouchEnd: v,
    onTouchMove: v,
    onTouchStart: v
  };
}
var attachedEventCounts = getDelegatedEventObject(0);
var attachedEvents = getDelegatedEventObject(null);
var syntheticEvents = getDelegatedEventObject(true);
function updateOrAddSyntheticEvent(name, dom) {
  var eventsObject = dom.$EV;
  if (!eventsObject) {
    eventsObject = dom.$EV = getDelegatedEventObject(null);
  }
  if (!eventsObject[name]) {
    if (++attachedEventCounts[name] === 1) {
      attachedEvents[name] = attachEventToDocument(name);
    }
  }
  return eventsObject;
}
function unmountSyntheticEvent(name, dom) {
  var eventsObject = dom.$EV;
  if (eventsObject && eventsObject[name]) {
    if (--attachedEventCounts[name] === 0) {
      document.removeEventListener(normalizeEventName(name), attachedEvents[name]);
      attachedEvents[name] = null;
    }
    eventsObject[name] = null;
  }
}
function handleSyntheticEvent(name, lastEvent, nextEvent, dom) {
  if (isFunction(nextEvent)) {
    updateOrAddSyntheticEvent(name, dom)[name] = nextEvent;
  } else if (isLinkEventObject(nextEvent)) {
    if (isLastValueSameLinkEvent(lastEvent, nextEvent)) {
      return;
    }
    updateOrAddSyntheticEvent(name, dom)[name] = nextEvent;
  } else {
    unmountSyntheticEvent(name, dom);
  }
}
function getTargetNode(event) {
  return isFunction(event.composedPath) ? event.composedPath()[0] : event.target;
}
function dispatchEvents(event, isClick, name, eventData) {
  var dom = getTargetNode(event);
  do {
    if (isClick && dom.disabled) {
      return;
    }
    var eventsObject = dom.$EV;
    if (eventsObject) {
      var currentEvent = eventsObject[name];
      if (currentEvent) {
        eventData.dom = dom;
        currentEvent.event ? currentEvent.event(currentEvent.data, event) : currentEvent(event);
        if (event.cancelBubble) {
          return;
        }
      }
    }
    dom = dom.parentNode;
  } while (!isNull(dom));
}
function stopPropagation() {
  this.cancelBubble = true;
  if (!this.immediatePropagationStopped) {
    this.stopImmediatePropagation();
  }
}
function isDefaultPrevented() {
  return this.defaultPrevented;
}
function isPropagationStopped() {
  return this.cancelBubble;
}
function extendEventProperties(event) {
  var eventData = {
    dom: document
  };
  event.isDefaultPrevented = isDefaultPrevented;
  event.isPropagationStopped = isPropagationStopped;
  event.stopPropagation = stopPropagation;
  Object.defineProperty(event, "currentTarget", {
    configurable: true,
    get: function get() {
      return eventData.dom;
    }
  });
  return eventData;
}
function rootClickEvent(name) {
  return function(event) {
    if (event.button !== 0) {
      event.stopPropagation();
      return;
    }
    dispatchEvents(event, true, name, extendEventProperties(event));
  };
}
function rootEvent(name) {
  return function(event) {
    dispatchEvents(event, false, name, extendEventProperties(event));
  };
}
function attachEventToDocument(name) {
  var attachedEvent = name === "onClick" || name === "onDblClick" ? rootClickEvent(name) : rootEvent(name);
  document.addEventListener(normalizeEventName(name), attachedEvent);
  return attachedEvent;
}
function isSameInnerHTML(dom, innerHTML) {
  var tempdom = document.createElement("i");
  tempdom.innerHTML = innerHTML;
  return tempdom.innerHTML === dom.innerHTML;
}
function triggerEventListener(props, methodName, e) {
  if (props[methodName]) {
    var listener = props[methodName];
    if (listener.event) {
      listener.event(listener.data, e);
    } else {
      listener(e);
    }
  } else {
    var nativeListenerName = methodName.toLowerCase();
    if (props[nativeListenerName]) {
      props[nativeListenerName](e);
    }
  }
}
function createWrappedFunction(methodName, applyValue) {
  var fnMethod = function fnMethod(e) {
    var vNode = this.$V;
    if (!vNode) {
      return;
    }
    var props = vNode.props || EMPTY_OBJ;
    var dom = vNode.dom;
    if (isString(methodName)) {
      triggerEventListener(props, methodName, e);
    } else {
      for (var i = 0;i < methodName.length; ++i) {
        triggerEventListener(props, methodName[i], e);
      }
    }
    if (isFunction(applyValue)) {
      var newVNode = this.$V;
      var newProps = newVNode.props || EMPTY_OBJ;
      applyValue(newProps, dom, false, newVNode);
    }
  };
  Object.defineProperty(fnMethod, "wrapped", {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });
  return fnMethod;
}
function attachEvent(dom, eventName, handler) {
  var previousKey = "$" + eventName;
  var previousArgs = dom[previousKey];
  if (previousArgs) {
    if (previousArgs[1].wrapped) {
      return;
    }
    dom.removeEventListener(previousArgs[0], previousArgs[1]);
    dom[previousKey] = null;
  }
  if (isFunction(handler)) {
    dom.addEventListener(eventName, handler);
    dom[previousKey] = [eventName, handler];
  }
}
function isCheckedType(type) {
  return type === "checkbox" || type === "radio";
}
var onTextInputChange = createWrappedFunction("onInput", applyValueInput);
var wrappedOnChange$1 = createWrappedFunction(["onClick", "onChange"], applyValueInput);
function emptywrapper(event) {
  event.stopPropagation();
}
emptywrapper.wrapped = true;
function inputEvents(dom, nextPropsOrEmpty) {
  if (isCheckedType(nextPropsOrEmpty.type)) {
    attachEvent(dom, "change", wrappedOnChange$1);
    attachEvent(dom, "click", emptywrapper);
  } else {
    attachEvent(dom, "input", onTextInputChange);
  }
}
function applyValueInput(nextPropsOrEmpty, dom) {
  var type = nextPropsOrEmpty.type;
  var value = nextPropsOrEmpty.value;
  var checked = nextPropsOrEmpty.checked;
  var multiple = nextPropsOrEmpty.multiple;
  var defaultValue = nextPropsOrEmpty.defaultValue;
  var hasValue = !isNullOrUndef(value);
  if (type && type !== dom.type) {
    dom.setAttribute("type", type);
  }
  if (!isNullOrUndef(multiple) && multiple !== dom.multiple) {
    dom.multiple = multiple;
  }
  if (!isNullOrUndef(defaultValue) && !hasValue) {
    dom.defaultValue = defaultValue + "";
  }
  if (isCheckedType(type)) {
    if (hasValue) {
      dom.value = value;
    }
    if (!isNullOrUndef(checked)) {
      dom.checked = checked;
    }
  } else {
    if (hasValue && dom.value !== value) {
      dom.defaultValue = value;
      dom.value = value;
    } else if (!isNullOrUndef(checked)) {
      dom.checked = checked;
    }
  }
}
function updateChildOptions(vNode, value) {
  if (vNode.type === "option") {
    updateChildOption(vNode, value);
  } else {
    var children = vNode.children;
    var flags = vNode.flags;
    if (flags & 4) {
      updateChildOptions(children.$LI, value);
    } else if (flags & 8) {
      updateChildOptions(children, value);
    } else if (vNode.childFlags === 2) {
      updateChildOptions(children, value);
    } else if (vNode.childFlags & 12) {
      for (var i = 0, len = children.length;i < len; ++i) {
        updateChildOptions(children[i], value);
      }
    }
  }
}
function updateChildOption(vNode, value) {
  var props = vNode.props || EMPTY_OBJ;
  var dom = vNode.dom;
  dom.value = props.value;
  if (props.value === value || isArray(value) && value.indexOf(props.value) !== -1) {
    dom.selected = true;
  } else if (!isNullOrUndef(value) || !isNullOrUndef(props.selected)) {
    dom.selected = props.selected || false;
  }
}
var onSelectChange = createWrappedFunction("onChange", applyValueSelect);
function selectEvents(dom) {
  attachEvent(dom, "change", onSelectChange);
}
function applyValueSelect(nextPropsOrEmpty, dom, mounting, vNode) {
  var multiplePropInBoolean = Boolean(nextPropsOrEmpty.multiple);
  if (!isNullOrUndef(nextPropsOrEmpty.multiple) && multiplePropInBoolean !== dom.multiple) {
    dom.multiple = multiplePropInBoolean;
  }
  var index = nextPropsOrEmpty.selectedIndex;
  if (index === -1) {
    dom.selectedIndex = -1;
  }
  var childFlags = vNode.childFlags;
  if (childFlags !== 1) {
    var value = nextPropsOrEmpty.value;
    if (isNumber(index) && index > -1 && dom.options[index]) {
      value = dom.options[index].value;
    }
    if (mounting && isNullOrUndef(value)) {
      value = nextPropsOrEmpty.defaultValue;
    }
    updateChildOptions(vNode, value);
  }
}
var onTextareaInputChange = createWrappedFunction("onInput", applyValueTextArea);
var wrappedOnChange = createWrappedFunction("onChange");
function textAreaEvents(dom, nextPropsOrEmpty) {
  attachEvent(dom, "input", onTextareaInputChange);
  if (nextPropsOrEmpty.onChange) {
    attachEvent(dom, "change", wrappedOnChange);
  }
}
function applyValueTextArea(nextPropsOrEmpty, dom, mounting) {
  var value = nextPropsOrEmpty.value;
  var domValue = dom.value;
  if (isNullOrUndef(value)) {
    if (mounting) {
      var defaultValue = nextPropsOrEmpty.defaultValue;
      if (!isNullOrUndef(defaultValue) && defaultValue !== domValue) {
        dom.defaultValue = defaultValue;
        dom.value = defaultValue;
      }
    }
  } else if (domValue !== value) {
    dom.defaultValue = value;
    dom.value = value;
  }
}
function processElement(flags, vNode, dom, nextPropsOrEmpty, mounting, isControlled) {
  if (flags & 64) {
    applyValueInput(nextPropsOrEmpty, dom);
  } else if (flags & 256) {
    applyValueSelect(nextPropsOrEmpty, dom, mounting, vNode);
  } else if (flags & 128) {
    applyValueTextArea(nextPropsOrEmpty, dom, mounting);
  }
  if (isControlled) {
    dom.$V = vNode;
  }
}
function addFormElementEventHandlers(flags, dom, nextPropsOrEmpty) {
  if (flags & 64) {
    inputEvents(dom, nextPropsOrEmpty);
  } else if (flags & 256) {
    selectEvents(dom);
  } else if (flags & 128) {
    textAreaEvents(dom, nextPropsOrEmpty);
  }
}
function isControlledFormElement(nextPropsOrEmpty) {
  return nextPropsOrEmpty.type && isCheckedType(nextPropsOrEmpty.type) ? !isNullOrUndef(nextPropsOrEmpty.checked) : !isNullOrUndef(nextPropsOrEmpty.value);
}
function unmountRef(ref) {
  if (ref) {
    if (!safeCall1(ref, null) && ref.current) {
      ref.current = null;
    }
  }
}
function mountRef(ref, value, lifecycle) {
  if (ref && (isFunction(ref) || ref.current !== undefined)) {
    lifecycle.push(function() {
      if (!safeCall1(ref, value) && ref.current !== undefined) {
        ref.current = value;
      }
    });
  }
}
function remove(vNode, parentDOM, animations) {
  unmount(vNode, animations);
  removeVNodeDOM(vNode, parentDOM, animations);
}
function unmount(vNode, animations) {
  var flags = vNode.flags;
  var children = vNode.children;
  var ref;
  if (flags & 481) {
    ref = vNode.ref;
    var props = vNode.props;
    unmountRef(ref);
    var childFlags = vNode.childFlags;
    if (!isNull(props)) {
      var keys = Object.keys(props);
      for (var i = 0, len = keys.length;i < len; i++) {
        var key = keys[i];
        if (syntheticEvents[key]) {
          unmountSyntheticEvent(key, vNode.dom);
        }
      }
    }
    if (childFlags & 12) {
      unmountAllChildren(children, animations);
    } else if (childFlags === 2) {
      unmount(children, animations);
    }
  } else if (children) {
    if (flags & 4) {
      if (isFunction(children.componentWillUnmount)) {
        children.componentWillUnmount();
      }
      var childAnimations = animations;
      if (isFunction(children.componentWillDisappear)) {
        childAnimations = new AnimationQueues;
        addDisappearAnimationHook(animations, children, children.$LI.dom, flags, undefined);
      }
      unmountRef(vNode.ref);
      children.$UN = true;
      unmount(children.$LI, childAnimations);
    } else if (flags & 8) {
      var _childAnimations = animations;
      ref = vNode.ref;
      if (!isNullOrUndef(ref)) {
        var domEl = null;
        if (isFunction(ref.onComponentWillUnmount)) {
          domEl = findDOMFromVNode(vNode, true);
          ref.onComponentWillUnmount(domEl, vNode.props || EMPTY_OBJ);
        }
        if (isFunction(ref.onComponentWillDisappear)) {
          _childAnimations = new AnimationQueues;
          domEl = domEl || findDOMFromVNode(vNode, true);
          addDisappearAnimationHook(animations, ref, domEl, flags, vNode.props);
        }
      }
      unmount(children, _childAnimations);
    } else if (flags & 1024) {
      remove(children, vNode.ref, animations);
    } else if (flags & 8192) {
      if (vNode.childFlags & 12) {
        unmountAllChildren(children, animations);
      }
    }
  }
}
function unmountAllChildren(children, animations) {
  for (var i = 0, len = children.length;i < len; ++i) {
    unmount(children[i], animations);
  }
}
function createClearAllCallback(children, parentDOM) {
  return function() {
    if (parentDOM) {
      for (var i = 0;i < children.length; i++) {
        var vNode = children[i];
        clearVNodeDOM(vNode, parentDOM, false);
      }
    }
  };
}
function clearDOM(parentDOM, children, animations) {
  if (animations.componentWillDisappear.length > 0) {
    callAllAnimationHooks(animations.componentWillDisappear, createClearAllCallback(children, parentDOM));
  } else {
    parentDOM.textContent = "";
  }
}
function removeAllChildren(dom, vNode, children, animations) {
  unmountAllChildren(children, animations);
  if (vNode.flags & 8192) {
    removeVNodeDOM(vNode, dom, animations);
  } else {
    clearDOM(dom, children, animations);
  }
}
function addDisappearAnimationHook(animations, instanceOrRef, dom, flags, props) {
  animations.componentWillDisappear.push(function(callback) {
    if (flags & 4) {
      instanceOrRef.componentWillDisappear(dom, callback);
    } else if (flags & 8) {
      instanceOrRef.onComponentWillDisappear(dom, props, callback);
    }
  });
}
function wrapLinkEvent(nextValue) {
  var ev = nextValue.event;
  return function(e) {
    ev(nextValue.data, e);
  };
}
function patchEvent(name, lastValue, nextValue, dom) {
  if (isLinkEventObject(nextValue)) {
    if (isLastValueSameLinkEvent(lastValue, nextValue)) {
      return;
    }
    nextValue = wrapLinkEvent(nextValue);
  }
  attachEvent(dom, normalizeEventName(name), nextValue);
}
function patchStyle(lastAttrValue, nextAttrValue, dom) {
  if (isNullOrUndef(nextAttrValue)) {
    dom.removeAttribute("style");
    return;
  }
  var domStyle = dom.style;
  var style;
  var value;
  if (isString(nextAttrValue)) {
    domStyle.cssText = nextAttrValue;
    return;
  }
  if (!isNullOrUndef(lastAttrValue) && !isString(lastAttrValue)) {
    for (style in nextAttrValue) {
      value = nextAttrValue[style];
      if (value !== lastAttrValue[style]) {
        domStyle.setProperty(style, value);
      }
    }
    for (style in lastAttrValue) {
      if (isNullOrUndef(nextAttrValue[style])) {
        domStyle.removeProperty(style);
      }
    }
  } else {
    for (style in nextAttrValue) {
      value = nextAttrValue[style];
      domStyle.setProperty(style, value);
    }
  }
}
function patchDangerInnerHTML(lastValue, nextValue, lastVNode, dom, animations) {
  var lastHtml = lastValue && lastValue.__html || "";
  var nextHtml = nextValue && nextValue.__html || "";
  if (lastHtml !== nextHtml) {
    if (!isNullOrUndef(nextHtml) && !isSameInnerHTML(dom, nextHtml)) {
      if (!isNull(lastVNode)) {
        if (lastVNode.childFlags & 12) {
          unmountAllChildren(lastVNode.children, animations);
        } else if (lastVNode.childFlags === 2) {
          unmount(lastVNode.children, animations);
        }
        lastVNode.children = null;
        lastVNode.childFlags = 1;
      }
      dom.innerHTML = nextHtml;
    }
  }
}
function patchProp(prop, lastValue, nextValue, dom, isSVG, hasControlledValue, lastVNode, animations) {
  switch (prop) {
    case "children":
    case "childrenType":
    case "className":
    case "defaultValue":
    case "key":
    case "multiple":
    case "ref":
    case "selectedIndex":
      break;
    case "autoFocus":
      dom.autofocus = !!nextValue;
      break;
    case "allowfullscreen":
    case "autoplay":
    case "capture":
    case "checked":
    case "controls":
    case "default":
    case "disabled":
    case "hidden":
    case "indeterminate":
    case "loop":
    case "muted":
    case "novalidate":
    case "open":
    case "readOnly":
    case "required":
    case "reversed":
    case "scoped":
    case "seamless":
    case "selected":
      dom[prop] = !!nextValue;
      break;
    case "defaultChecked":
    case "value":
    case "volume":
      if (hasControlledValue && prop === "value") {
        break;
      }
      var value = isNullOrUndef(nextValue) ? "" : nextValue;
      if (dom[prop] !== value) {
        dom[prop] = value;
      }
      break;
    case "style":
      patchStyle(lastValue, nextValue, dom);
      break;
    case "dangerouslySetInnerHTML":
      patchDangerInnerHTML(lastValue, nextValue, lastVNode, dom, animations);
      break;
    default:
      if (syntheticEvents[prop]) {
        handleSyntheticEvent(prop, lastValue, nextValue, dom);
      } else if (prop.charCodeAt(0) === 111 && prop.charCodeAt(1) === 110) {
        patchEvent(prop, lastValue, nextValue, dom);
      } else if (isNullOrUndef(nextValue)) {
        dom.removeAttribute(prop);
      } else if (isSVG && namespaces[prop]) {
        dom.setAttributeNS(namespaces[prop], prop, nextValue);
      } else {
        dom.setAttribute(prop, nextValue);
      }
      break;
  }
}
function mountProps(vNode, flags, props, dom, isSVG, animations) {
  var hasControlledValue = false;
  var isFormElement = (flags & 448) > 0;
  if (isFormElement) {
    hasControlledValue = isControlledFormElement(props);
    if (hasControlledValue) {
      addFormElementEventHandlers(flags, dom, props);
    }
  }
  for (var prop in props) {
    patchProp(prop, null, props[prop], dom, isSVG, hasControlledValue, null, animations);
  }
  if (isFormElement) {
    processElement(flags, vNode, dom, props, true, hasControlledValue);
  }
}
function renderNewInput(instance, props, context) {
  var nextInput = normalizeRoot(instance.render(props, instance.state, context));
  var childContext = context;
  if (isFunction(instance.getChildContext)) {
    childContext = combineFrom(context, instance.getChildContext());
  }
  instance.$CX = childContext;
  return nextInput;
}
function createClassComponentInstance(vNode, Component, props, context, isSVG, lifecycle) {
  var instance = new Component(props, context);
  var usesNewAPI = instance.$N = Boolean(Component.getDerivedStateFromProps || instance.getSnapshotBeforeUpdate);
  instance.$SVG = isSVG;
  instance.$L = lifecycle;
  vNode.children = instance;
  instance.$BS = false;
  instance.context = context;
  if (instance.props === EMPTY_OBJ) {
    instance.props = props;
  }
  if (!usesNewAPI) {
    if (isFunction(instance.componentWillMount)) {
      instance.$BR = true;
      instance.componentWillMount();
      var pending = instance.$PS;
      if (!isNull(pending)) {
        var state = instance.state;
        if (isNull(state)) {
          instance.state = pending;
        } else {
          for (var key in pending) {
            state[key] = pending[key];
          }
        }
        instance.$PS = null;
      }
      instance.$BR = false;
    }
  } else {
    instance.state = createDerivedState(instance, props, instance.state);
  }
  instance.$LI = renderNewInput(instance, props, context);
  return instance;
}
function renderFunctionalComponent(vNode, context) {
  var props = vNode.props || EMPTY_OBJ;
  return vNode.flags & 32768 ? vNode.type.render(props, vNode.ref, context) : vNode.type(props, context);
}
function mount(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var flags = vNode.flags |= 16384;
  if (flags & 481) {
    mountElement(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (flags & 4) {
    mountClassComponent(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (flags & 8) {
    mountFunctionalComponent(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (flags & 16) {
    mountText(vNode, parentDOM, nextNode);
  } else if (flags & 8192) {
    mountFragment(vNode, context, parentDOM, isSVG, nextNode, lifecycle, animations);
  } else if (flags & 1024) {
    mountPortal(vNode, context, parentDOM, nextNode, lifecycle, animations);
  } else
    ;
}
function mountPortal(vNode, context, parentDOM, nextNode, lifecycle, animations) {
  mount(vNode.children, vNode.ref, context, false, null, lifecycle, animations);
  var placeHolderVNode = createVoidVNode();
  mountText(placeHolderVNode, parentDOM, nextNode);
  vNode.dom = placeHolderVNode.dom;
}
function mountFragment(vNode, context, parentDOM, isSVG, nextNode, lifecycle, animations) {
  var children = vNode.children;
  var childFlags = vNode.childFlags;
  if (childFlags & 12 && children.length === 0) {
    childFlags = vNode.childFlags = 2;
    children = vNode.children = createVoidVNode();
  }
  if (childFlags === 2) {
    mount(children, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else {
    mountArrayChildren(children, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  }
}
function mountText(vNode, parentDOM, nextNode) {
  var dom = vNode.dom = document.createTextNode(vNode.children);
  if (!isNull(parentDOM)) {
    insertOrAppend(parentDOM, dom, nextNode);
  }
}
function mountElement(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var flags = vNode.flags;
  var props = vNode.props;
  var className = vNode.className;
  var childFlags = vNode.childFlags;
  var dom = vNode.dom = documentCreateElement(vNode.type, isSVG = isSVG || (flags & 32) > 0);
  var children = vNode.children;
  if (!isNullOrUndef(className) && className !== "") {
    if (isSVG) {
      dom.setAttribute("class", className);
    } else {
      dom.className = className;
    }
  }
  if (childFlags === 16) {
    setTextContent(dom, children);
  } else if (childFlags !== 1) {
    var childrenIsSVG = isSVG && vNode.type !== "foreignObject";
    if (childFlags === 2) {
      if (children.flags & 16384) {
        vNode.children = children = directClone(children);
      }
      mount(children, dom, context, childrenIsSVG, null, lifecycle, animations);
    } else if (childFlags === 8 || childFlags === 4) {
      mountArrayChildren(children, dom, context, childrenIsSVG, null, lifecycle, animations);
    }
  }
  if (!isNull(parentDOM)) {
    insertOrAppend(parentDOM, dom, nextNode);
  }
  if (!isNull(props)) {
    mountProps(vNode, flags, props, dom, isSVG, animations);
  }
  mountRef(vNode.ref, dom, lifecycle);
}
function mountArrayChildren(children, dom, context, isSVG, nextNode, lifecycle, animations) {
  for (var i = 0;i < children.length; ++i) {
    var child = children[i];
    if (child.flags & 16384) {
      children[i] = child = directClone(child);
    }
    mount(child, dom, context, isSVG, nextNode, lifecycle, animations);
  }
}
function mountClassComponent(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var instance = createClassComponentInstance(vNode, vNode.type, vNode.props || EMPTY_OBJ, context, isSVG, lifecycle);
  var childAnimations = animations;
  if (isFunction(instance.componentDidAppear)) {
    childAnimations = new AnimationQueues;
  }
  mount(instance.$LI, parentDOM, instance.$CX, isSVG, nextNode, lifecycle, childAnimations);
  mountClassComponentCallbacks(vNode.ref, instance, lifecycle, animations);
}
function mountFunctionalComponent(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var ref = vNode.ref;
  var childAnimations = animations;
  if (!isNullOrUndef(ref) && isFunction(ref.onComponentDidAppear)) {
    childAnimations = new AnimationQueues;
  }
  mount(vNode.children = normalizeRoot(renderFunctionalComponent(vNode, context)), parentDOM, context, isSVG, nextNode, lifecycle, childAnimations);
  mountFunctionalComponentCallbacks(vNode, lifecycle, animations);
}
function createClassMountCallback(instance) {
  return function() {
    instance.componentDidMount();
  };
}
function addAppearAnimationHook(animations, instanceOrRef, dom, flags, props) {
  animations.componentDidAppear.push(function() {
    if (flags & 4) {
      instanceOrRef.componentDidAppear(dom);
    } else if (flags & 8) {
      instanceOrRef.onComponentDidAppear(dom, props);
    }
  });
}
function mountClassComponentCallbacks(ref, instance, lifecycle, animations) {
  mountRef(ref, instance, lifecycle);
  if (isFunction(instance.componentDidMount)) {
    lifecycle.push(createClassMountCallback(instance));
  }
  if (isFunction(instance.componentDidAppear)) {
    addAppearAnimationHook(animations, instance, instance.$LI.dom, 4, undefined);
  }
}
function createOnMountCallback(ref, vNode) {
  return function() {
    ref.onComponentDidMount(findDOMFromVNode(vNode, true), vNode.props || EMPTY_OBJ);
  };
}
function mountFunctionalComponentCallbacks(vNode, lifecycle, animations) {
  var ref = vNode.ref;
  if (!isNullOrUndef(ref)) {
    safeCall1(ref.onComponentWillMount, vNode.props || EMPTY_OBJ);
    if (isFunction(ref.onComponentDidMount)) {
      lifecycle.push(createOnMountCallback(ref, vNode));
    }
    if (isFunction(ref.onComponentDidAppear)) {
      addAppearAnimationHook(animations, ref, findDOMFromVNode(vNode, true), 8, vNode.props);
    }
  }
}
function replaceWithNewNode(lastVNode, nextVNode, parentDOM, context, isSVG, lifecycle, animations) {
  unmount(lastVNode, animations);
  if ((nextVNode.flags & lastVNode.flags & 1521) !== 0) {
    mount(nextVNode, null, context, isSVG, null, lifecycle, animations);
    replaceChild(parentDOM, nextVNode.dom, lastVNode.dom);
  } else {
    mount(nextVNode, parentDOM, context, isSVG, findDOMFromVNode(lastVNode, true), lifecycle, animations);
    removeVNodeDOM(lastVNode, parentDOM, animations);
  }
}
function patch(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var nextFlags = nextVNode.flags |= 16384;
  if (lastVNode.flags !== nextFlags || lastVNode.type !== nextVNode.type || lastVNode.key !== nextVNode.key || nextFlags & 2048) {
    if (lastVNode.flags & 16384) {
      replaceWithNewNode(lastVNode, nextVNode, parentDOM, context, isSVG, lifecycle, animations);
    } else {
      mount(nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
    }
  } else if (nextFlags & 481) {
    patchElement(lastVNode, nextVNode, context, isSVG, nextFlags, lifecycle, animations);
  } else if (nextFlags & 4) {
    patchClassComponent(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (nextFlags & 8) {
    patchFunctionalComponent(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (nextFlags & 16) {
    patchText(lastVNode, nextVNode);
  } else if (nextFlags & 8192) {
    patchFragment(lastVNode, nextVNode, parentDOM, context, isSVG, lifecycle, animations);
  } else {
    patchPortal(lastVNode, nextVNode, context, lifecycle, animations);
  }
}
function patchSingleTextChild(lastChildren, nextChildren, parentDOM) {
  if (lastChildren !== nextChildren) {
    if (lastChildren !== "") {
      parentDOM.firstChild.nodeValue = nextChildren;
    } else {
      setTextContent(parentDOM, nextChildren);
    }
  }
}
function patchContentEditableChildren(dom, nextChildren) {
  if (dom.textContent !== nextChildren) {
    dom.textContent = nextChildren;
  }
}
function patchFragment(lastVNode, nextVNode, parentDOM, context, isSVG, lifecycle, animations) {
  var lastChildren = lastVNode.children;
  var nextChildren = nextVNode.children;
  var lastChildFlags = lastVNode.childFlags;
  var nextChildFlags = nextVNode.childFlags;
  var nextNode = null;
  if (nextChildFlags & 12 && nextChildren.length === 0) {
    nextChildFlags = nextVNode.childFlags = 2;
    nextChildren = nextVNode.children = createVoidVNode();
  }
  var nextIsSingle = (nextChildFlags & 2) !== 0;
  if (lastChildFlags & 12) {
    var lastLen = lastChildren.length;
    if (lastChildFlags & 8 && nextChildFlags & 8 || nextIsSingle || !nextIsSingle && nextChildren.length > lastLen) {
      nextNode = findDOMFromVNode(lastChildren[lastLen - 1], false).nextSibling;
    }
  }
  patchChildren(lastChildFlags, nextChildFlags, lastChildren, nextChildren, parentDOM, context, isSVG, nextNode, lastVNode, lifecycle, animations);
}
function patchPortal(lastVNode, nextVNode, context, lifecycle, animations) {
  var lastContainer = lastVNode.ref;
  var nextContainer = nextVNode.ref;
  var nextChildren = nextVNode.children;
  patchChildren(lastVNode.childFlags, nextVNode.childFlags, lastVNode.children, nextChildren, lastContainer, context, false, null, lastVNode, lifecycle, animations);
  nextVNode.dom = lastVNode.dom;
  if (lastContainer !== nextContainer && !isInvalid(nextChildren)) {
    var node = nextChildren.dom;
    removeChild(lastContainer, node);
    appendChild(nextContainer, node);
  }
}
function patchElement(lastVNode, nextVNode, context, isSVG, nextFlags, lifecycle, animations) {
  var dom = nextVNode.dom = lastVNode.dom;
  var lastProps = lastVNode.props;
  var nextProps = nextVNode.props;
  var isFormElement = false;
  var hasControlledValue = false;
  var nextPropsOrEmpty;
  isSVG = isSVG || (nextFlags & 32) > 0;
  if (lastProps !== nextProps) {
    var lastPropsOrEmpty = lastProps || EMPTY_OBJ;
    nextPropsOrEmpty = nextProps || EMPTY_OBJ;
    if (nextPropsOrEmpty !== EMPTY_OBJ) {
      isFormElement = (nextFlags & 448) > 0;
      if (isFormElement) {
        hasControlledValue = isControlledFormElement(nextPropsOrEmpty);
      }
      for (var prop in nextPropsOrEmpty) {
        var lastValue = lastPropsOrEmpty[prop];
        var nextValue = nextPropsOrEmpty[prop];
        if (lastValue !== nextValue) {
          patchProp(prop, lastValue, nextValue, dom, isSVG, hasControlledValue, lastVNode, animations);
        }
      }
    }
    if (lastPropsOrEmpty !== EMPTY_OBJ) {
      for (var _prop in lastPropsOrEmpty) {
        if (isNullOrUndef(nextPropsOrEmpty[_prop]) && !isNullOrUndef(lastPropsOrEmpty[_prop])) {
          patchProp(_prop, lastPropsOrEmpty[_prop], null, dom, isSVG, hasControlledValue, lastVNode, animations);
        }
      }
    }
  }
  var nextChildren = nextVNode.children;
  var nextClassName = nextVNode.className;
  if (lastVNode.className !== nextClassName) {
    if (isNullOrUndef(nextClassName)) {
      dom.removeAttribute("class");
    } else if (isSVG) {
      dom.setAttribute("class", nextClassName);
    } else {
      dom.className = nextClassName;
    }
  }
  if (nextFlags & 4096) {
    patchContentEditableChildren(dom, nextChildren);
  } else {
    patchChildren(lastVNode.childFlags, nextVNode.childFlags, lastVNode.children, nextChildren, dom, context, isSVG && nextVNode.type !== "foreignObject", null, lastVNode, lifecycle, animations);
  }
  if (isFormElement) {
    processElement(nextFlags, nextVNode, dom, nextPropsOrEmpty, false, hasControlledValue);
  }
  var nextRef = nextVNode.ref;
  var lastRef = lastVNode.ref;
  if (lastRef !== nextRef) {
    unmountRef(lastRef);
    mountRef(nextRef, dom, lifecycle);
  }
}
function replaceOneVNodeWithMultipleVNodes(lastChildren, nextChildren, parentDOM, context, isSVG, lifecycle, animations) {
  unmount(lastChildren, animations);
  mountArrayChildren(nextChildren, parentDOM, context, isSVG, findDOMFromVNode(lastChildren, true), lifecycle, animations);
  removeVNodeDOM(lastChildren, parentDOM, animations);
}
function patchChildren(lastChildFlags, nextChildFlags, lastChildren, nextChildren, parentDOM, context, isSVG, nextNode, parentVNode, lifecycle, animations) {
  switch (lastChildFlags) {
    case 2:
      switch (nextChildFlags) {
        case 2:
          patch(lastChildren, nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
        case 1:
          remove(lastChildren, parentDOM, animations);
          break;
        case 16:
          unmount(lastChildren, animations);
          setTextContent(parentDOM, nextChildren);
          break;
        default:
          replaceOneVNodeWithMultipleVNodes(lastChildren, nextChildren, parentDOM, context, isSVG, lifecycle, animations);
          break;
      }
      break;
    case 1:
      switch (nextChildFlags) {
        case 2:
          mount(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
        case 1:
          break;
        case 16:
          setTextContent(parentDOM, nextChildren);
          break;
        default:
          mountArrayChildren(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
      }
      break;
    case 16:
      switch (nextChildFlags) {
        case 16:
          patchSingleTextChild(lastChildren, nextChildren, parentDOM);
          break;
        case 2:
          clearDOM(parentDOM, lastChildren, animations);
          mount(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
        case 1:
          clearDOM(parentDOM, lastChildren, animations);
          break;
        default:
          clearDOM(parentDOM, lastChildren, animations);
          mountArrayChildren(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
      }
      break;
    default:
      switch (nextChildFlags) {
        case 16:
          unmountAllChildren(lastChildren, animations);
          setTextContent(parentDOM, nextChildren);
          break;
        case 2:
          removeAllChildren(parentDOM, parentVNode, lastChildren, animations);
          mount(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
        case 1:
          removeAllChildren(parentDOM, parentVNode, lastChildren, animations);
          break;
        default:
          var lastLength = lastChildren.length | 0;
          var nextLength = nextChildren.length | 0;
          if (lastLength === 0) {
            if (nextLength > 0) {
              mountArrayChildren(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
            }
          } else if (nextLength === 0) {
            removeAllChildren(parentDOM, parentVNode, lastChildren, animations);
          } else if (nextChildFlags === 8 && lastChildFlags === 8) {
            patchKeyedChildren(lastChildren, nextChildren, parentDOM, context, isSVG, lastLength, nextLength, nextNode, parentVNode, lifecycle, animations);
          } else {
            patchNonKeyedChildren(lastChildren, nextChildren, parentDOM, context, isSVG, lastLength, nextLength, nextNode, lifecycle, animations);
          }
          break;
      }
      break;
  }
}
function createDidUpdate(instance, lastProps, lastState, snapshot, lifecycle) {
  lifecycle.push(function() {
    instance.componentDidUpdate(lastProps, lastState, snapshot);
  });
}
function updateClassComponent(instance, nextState, nextProps, parentDOM, context, isSVG, force, nextNode, lifecycle, animations) {
  var lastState = instance.state;
  var lastProps = instance.props;
  var usesNewAPI = Boolean(instance.$N);
  var hasSCU = isFunction(instance.shouldComponentUpdate);
  if (usesNewAPI) {
    nextState = createDerivedState(instance, nextProps, nextState !== lastState ? combineFrom(lastState, nextState) : nextState);
  }
  if (force || !hasSCU || hasSCU && instance.shouldComponentUpdate(nextProps, nextState, context)) {
    if (!usesNewAPI && isFunction(instance.componentWillUpdate)) {
      instance.componentWillUpdate(nextProps, nextState, context);
    }
    instance.props = nextProps;
    instance.state = nextState;
    instance.context = context;
    var snapshot = null;
    var nextInput = renderNewInput(instance, nextProps, context);
    if (usesNewAPI && isFunction(instance.getSnapshotBeforeUpdate)) {
      snapshot = instance.getSnapshotBeforeUpdate(lastProps, lastState);
    }
    patch(instance.$LI, nextInput, parentDOM, instance.$CX, isSVG, nextNode, lifecycle, animations);
    instance.$LI = nextInput;
    if (isFunction(instance.componentDidUpdate)) {
      createDidUpdate(instance, lastProps, lastState, snapshot, lifecycle);
    }
  } else {
    instance.props = nextProps;
    instance.state = nextState;
    instance.context = context;
  }
}
function patchClassComponent(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var instance = nextVNode.children = lastVNode.children;
  if (isNull(instance)) {
    return;
  }
  instance.$L = lifecycle;
  var nextProps = nextVNode.props || EMPTY_OBJ;
  var nextRef = nextVNode.ref;
  var lastRef = lastVNode.ref;
  var nextState = instance.state;
  if (!instance.$N) {
    if (isFunction(instance.componentWillReceiveProps)) {
      instance.$BR = true;
      instance.componentWillReceiveProps(nextProps, context);
      if (instance.$UN) {
        return;
      }
      instance.$BR = false;
    }
    if (!isNull(instance.$PS)) {
      nextState = combineFrom(nextState, instance.$PS);
      instance.$PS = null;
    }
  }
  updateClassComponent(instance, nextState, nextProps, parentDOM, context, isSVG, false, nextNode, lifecycle, animations);
  if (lastRef !== nextRef) {
    unmountRef(lastRef);
    mountRef(nextRef, instance, lifecycle);
  }
}
function patchFunctionalComponent(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var shouldUpdate = true;
  var nextProps = nextVNode.props || EMPTY_OBJ;
  var nextRef = nextVNode.ref;
  var lastProps = lastVNode.props;
  var nextHooksDefined = !isNullOrUndef(nextRef);
  var lastInput = lastVNode.children;
  if (nextHooksDefined && isFunction(nextRef.onComponentShouldUpdate)) {
    shouldUpdate = nextRef.onComponentShouldUpdate(lastProps, nextProps);
  }
  if (shouldUpdate !== false) {
    if (nextHooksDefined && isFunction(nextRef.onComponentWillUpdate)) {
      nextRef.onComponentWillUpdate(lastProps, nextProps);
    }
    var nextInput = normalizeRoot(renderFunctionalComponent(nextVNode, context));
    patch(lastInput, nextInput, parentDOM, context, isSVG, nextNode, lifecycle, animations);
    nextVNode.children = nextInput;
    if (nextHooksDefined && isFunction(nextRef.onComponentDidUpdate)) {
      nextRef.onComponentDidUpdate(lastProps, nextProps);
    }
  } else {
    nextVNode.children = lastInput;
  }
}
function patchText(lastVNode, nextVNode) {
  var nextText = nextVNode.children;
  var dom = nextVNode.dom = lastVNode.dom;
  if (nextText !== lastVNode.children) {
    dom.nodeValue = nextText;
  }
}
function patchNonKeyedChildren(lastChildren, nextChildren, dom, context, isSVG, lastChildrenLength, nextChildrenLength, nextNode, lifecycle, animations) {
  var commonLength = lastChildrenLength > nextChildrenLength ? nextChildrenLength : lastChildrenLength;
  var i = 0;
  var nextChild;
  var lastChild;
  for (;i < commonLength; ++i) {
    nextChild = nextChildren[i];
    lastChild = lastChildren[i];
    if (nextChild.flags & 16384) {
      nextChild = nextChildren[i] = directClone(nextChild);
    }
    patch(lastChild, nextChild, dom, context, isSVG, nextNode, lifecycle, animations);
    lastChildren[i] = nextChild;
  }
  if (lastChildrenLength < nextChildrenLength) {
    for (i = commonLength;i < nextChildrenLength; ++i) {
      nextChild = nextChildren[i];
      if (nextChild.flags & 16384) {
        nextChild = nextChildren[i] = directClone(nextChild);
      }
      mount(nextChild, dom, context, isSVG, nextNode, lifecycle, animations);
    }
  } else if (lastChildrenLength > nextChildrenLength) {
    for (i = commonLength;i < lastChildrenLength; ++i) {
      remove(lastChildren[i], dom, animations);
    }
  }
}
function patchKeyedChildren(a, b, dom, context, isSVG, aLength, bLength, outerEdge, parentVNode, lifecycle, animations) {
  var aEnd = aLength - 1;
  var bEnd = bLength - 1;
  var j = 0;
  var aNode = a[j];
  var bNode = b[j];
  var nextPos;
  var nextNode;
  outer: {
    while (aNode.key === bNode.key) {
      if (bNode.flags & 16384) {
        b[j] = bNode = directClone(bNode);
      }
      patch(aNode, bNode, dom, context, isSVG, outerEdge, lifecycle, animations);
      a[j] = bNode;
      ++j;
      if (j > aEnd || j > bEnd) {
        break outer;
      }
      aNode = a[j];
      bNode = b[j];
    }
    aNode = a[aEnd];
    bNode = b[bEnd];
    while (aNode.key === bNode.key) {
      if (bNode.flags & 16384) {
        b[bEnd] = bNode = directClone(bNode);
      }
      patch(aNode, bNode, dom, context, isSVG, outerEdge, lifecycle, animations);
      a[aEnd] = bNode;
      aEnd--;
      bEnd--;
      if (j > aEnd || j > bEnd) {
        break outer;
      }
      aNode = a[aEnd];
      bNode = b[bEnd];
    }
  }
  if (j > aEnd) {
    if (j <= bEnd) {
      nextPos = bEnd + 1;
      nextNode = nextPos < bLength ? findDOMFromVNode(b[nextPos], true) : outerEdge;
      while (j <= bEnd) {
        bNode = b[j];
        if (bNode.flags & 16384) {
          b[j] = bNode = directClone(bNode);
        }
        ++j;
        mount(bNode, dom, context, isSVG, nextNode, lifecycle, animations);
      }
    }
  } else if (j > bEnd) {
    while (j <= aEnd) {
      remove(a[j++], dom, animations);
    }
  } else {
    patchKeyedChildrenComplex(a, b, context, aLength, bLength, aEnd, bEnd, j, dom, isSVG, outerEdge, parentVNode, lifecycle, animations);
  }
}
function patchKeyedChildrenComplex(a, b, context, aLength, bLength, aEnd, bEnd, j, dom, isSVG, outerEdge, parentVNode, lifecycle, animations) {
  var aNode;
  var bNode;
  var nextPos = 0;
  var i = 0;
  var aStart = j;
  var bStart = j;
  var aLeft = aEnd - j + 1;
  var bLeft = bEnd - j + 1;
  var sources = new Int32Array(bLeft + 1);
  var canRemoveWholeContent = aLeft === aLength;
  var moved = false;
  var pos = 0;
  var patched = 0;
  if (bLength < 4 || (aLeft | bLeft) < 32) {
    for (i = aStart;i <= aEnd; ++i) {
      aNode = a[i];
      if (patched < bLeft) {
        for (j = bStart;j <= bEnd; j++) {
          bNode = b[j];
          if (aNode.key === bNode.key) {
            sources[j - bStart] = i + 1;
            if (canRemoveWholeContent) {
              canRemoveWholeContent = false;
              while (aStart < i) {
                remove(a[aStart++], dom, animations);
              }
            }
            if (pos > j) {
              moved = true;
            } else {
              pos = j;
            }
            if (bNode.flags & 16384) {
              b[j] = bNode = directClone(bNode);
            }
            patch(aNode, bNode, dom, context, isSVG, outerEdge, lifecycle, animations);
            ++patched;
            break;
          }
        }
        if (!canRemoveWholeContent && j > bEnd) {
          remove(aNode, dom, animations);
        }
      } else if (!canRemoveWholeContent) {
        remove(aNode, dom, animations);
      }
    }
  } else {
    var keyIndex = {};
    for (i = bStart;i <= bEnd; ++i) {
      keyIndex[b[i].key] = i;
    }
    for (i = aStart;i <= aEnd; ++i) {
      aNode = a[i];
      if (patched < bLeft) {
        j = keyIndex[aNode.key];
        if (j !== undefined) {
          if (canRemoveWholeContent) {
            canRemoveWholeContent = false;
            while (i > aStart) {
              remove(a[aStart++], dom, animations);
            }
          }
          sources[j - bStart] = i + 1;
          if (pos > j) {
            moved = true;
          } else {
            pos = j;
          }
          bNode = b[j];
          if (bNode.flags & 16384) {
            b[j] = bNode = directClone(bNode);
          }
          patch(aNode, bNode, dom, context, isSVG, outerEdge, lifecycle, animations);
          ++patched;
        } else if (!canRemoveWholeContent) {
          remove(aNode, dom, animations);
        }
      } else if (!canRemoveWholeContent) {
        remove(aNode, dom, animations);
      }
    }
  }
  if (canRemoveWholeContent) {
    removeAllChildren(dom, parentVNode, a, animations);
    mountArrayChildren(b, dom, context, isSVG, outerEdge, lifecycle, animations);
  } else if (moved) {
    var seq = lis_algorithm(sources);
    j = seq.length - 1;
    for (i = bLeft - 1;i >= 0; i--) {
      if (sources[i] === 0) {
        pos = i + bStart;
        bNode = b[pos];
        if (bNode.flags & 16384) {
          b[pos] = bNode = directClone(bNode);
        }
        nextPos = pos + 1;
        mount(bNode, dom, context, isSVG, nextPos < bLength ? findDOMFromVNode(b[nextPos], true) : outerEdge, lifecycle, animations);
      } else if (j < 0 || i !== seq[j]) {
        pos = i + bStart;
        bNode = b[pos];
        nextPos = pos + 1;
        moveVNodeDOM(parentVNode, bNode, dom, nextPos < bLength ? findDOMFromVNode(b[nextPos], true) : outerEdge, animations);
      } else {
        j--;
      }
    }
    if (animations.componentWillMove.length > 0) {
      callAllMoveAnimationHooks(animations.componentWillMove);
    }
  } else if (patched !== bLeft) {
    for (i = bLeft - 1;i >= 0; i--) {
      if (sources[i] === 0) {
        pos = i + bStart;
        bNode = b[pos];
        if (bNode.flags & 16384) {
          b[pos] = bNode = directClone(bNode);
        }
        nextPos = pos + 1;
        mount(bNode, dom, context, isSVG, nextPos < bLength ? findDOMFromVNode(b[nextPos], true) : outerEdge, lifecycle, animations);
      }
    }
  }
}
var result;
var p;
var maxLen = 0;
function lis_algorithm(arr) {
  var arrI = 0;
  var i = 0;
  var j = 0;
  var k = 0;
  var u = 0;
  var v = 0;
  var c = 0;
  var len = arr.length;
  if (len > maxLen) {
    maxLen = len;
    result = new Int32Array(len);
    p = new Int32Array(len);
  }
  for (;i < len; ++i) {
    arrI = arr[i];
    if (arrI !== 0) {
      j = result[k];
      if (arr[j] < arrI) {
        p[i] = j;
        result[++k] = i;
        continue;
      }
      u = 0;
      v = k;
      while (u < v) {
        c = u + v >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = k + 1;
  var seq = new Int32Array(u);
  v = result[u - 1];
  while (u-- > 0) {
    seq[u] = v;
    v = p[v];
    result[u] = 0;
  }
  return seq;
}
var hasDocumentAvailable = typeof document !== "undefined";
if (hasDocumentAvailable) {
  if (window.Node) {
    Node.prototype.$EV = null;
    Node.prototype.$V = null;
  }
}
function __render(input, parentDOM, callback, context) {
  var lifecycle = [];
  var animations = new AnimationQueues;
  var rootInput = parentDOM.$V;
  renderCheck.v = true;
  if (isNullOrUndef(rootInput)) {
    if (!isNullOrUndef(input)) {
      if (input.flags & 16384) {
        input = directClone(input);
      }
      mount(input, parentDOM, context, false, null, lifecycle, animations);
      parentDOM.$V = input;
      rootInput = input;
    }
  } else {
    if (isNullOrUndef(input)) {
      remove(rootInput, parentDOM, animations);
      parentDOM.$V = null;
    } else {
      if (input.flags & 16384) {
        input = directClone(input);
      }
      patch(rootInput, input, parentDOM, context, false, null, lifecycle, animations);
      rootInput = parentDOM.$V = input;
    }
  }
  callAll(lifecycle);
  callAllAnimationHooks(animations.componentDidAppear);
  renderCheck.v = false;
  if (isFunction(callback)) {
    callback();
  }
  if (isFunction(options.renderComplete)) {
    options.renderComplete(rootInput, parentDOM);
  }
}
function render(input, parentDOM, callback, context) {
  if (callback === undefined) {
    callback = null;
  }
  if (context === undefined) {
    context = EMPTY_OBJ;
  }
  __render(input, parentDOM, callback, context);
}
var COMPONENTS_QUEUE = [];
var nextTick = typeof Promise !== "undefined" ? Promise.resolve().then.bind(Promise.resolve()) : function(a) {
  window.setTimeout(a, 0);
};
var microTaskPending = false;
function queueStateChanges(component, newState, callback, force) {
  var pending = component.$PS;
  if (isFunction(newState)) {
    newState = newState(pending ? combineFrom(component.state, pending) : component.state, component.props, component.context);
  }
  if (isNullOrUndef(pending)) {
    component.$PS = newState;
  } else {
    for (var stateKey in newState) {
      pending[stateKey] = newState[stateKey];
    }
  }
  if (!component.$BR) {
    if (!renderCheck.v) {
      if (COMPONENTS_QUEUE.length === 0) {
        applyState(component, force);
        if (isFunction(callback)) {
          callback.call(component);
        }
        return;
      }
    }
    if (COMPONENTS_QUEUE.indexOf(component) === -1) {
      COMPONENTS_QUEUE.push(component);
    }
    if (force) {
      component.$F = true;
    }
    if (!microTaskPending) {
      microTaskPending = true;
      nextTick(rerender);
    }
    if (isFunction(callback)) {
      var QU = component.$QU;
      if (!QU) {
        QU = component.$QU = [];
      }
      QU.push(callback);
    }
  } else if (isFunction(callback)) {
    component.$L.push(callback.bind(component));
  }
}
function callSetStateCallbacks(component) {
  var queue = component.$QU;
  for (var i = 0;i < queue.length; ++i) {
    queue[i].call(component);
  }
  component.$QU = null;
}
function rerender() {
  var component;
  microTaskPending = false;
  while (component = COMPONENTS_QUEUE.shift()) {
    if (!component.$UN) {
      var force = component.$F;
      component.$F = false;
      applyState(component, force);
      if (component.$QU) {
        callSetStateCallbacks(component);
      }
    }
  }
}
function applyState(component, force) {
  if (force || !component.$BR) {
    var pendingState = component.$PS;
    component.$PS = null;
    var lifecycle = [];
    var animations = new AnimationQueues;
    renderCheck.v = true;
    updateClassComponent(component, combineFrom(component.state, pendingState), component.props, findDOMFromVNode(component.$LI, true).parentNode, component.context, component.$SVG, force, null, lifecycle, animations);
    callAll(lifecycle);
    callAllAnimationHooks(animations.componentDidAppear);
    renderCheck.v = false;
  } else {
    component.state = component.$PS;
    component.$PS = null;
  }
}
var Component = /* @__PURE__ */ function() {
  function Component2(props, context) {
    this.state = null;
    this.props = undefined;
    this.context = undefined;
    this.displayName = undefined;
    this.$BR = false;
    this.$BS = true;
    this.$PS = null;
    this.$LI = null;
    this.$UN = false;
    this.$CX = null;
    this.$QU = null;
    this.$N = false;
    this.$SSR = undefined;
    this.$L = null;
    this.$SVG = false;
    this.$F = false;
    this.props = props || EMPTY_OBJ;
    this.context = context || EMPTY_OBJ;
  }
  var _proto = Component2.prototype;
  _proto.forceUpdate = function forceUpdate(callback) {
    if (this.$UN) {
      return;
    }
    queueStateChanges(this, {}, callback, true);
  };
  _proto.setState = function setState(newState, callback) {
    if (this.$UN) {
      return;
    }
    if (!this.$BS) {
      queueStateChanges(this, newState, callback, false);
    }
  };
  _proto.render = function render(props, state, context) {
    return null;
  };
  return Component2;
}();
Component.defaultProps = null;

// node_modules/inferno/index.esm.js
if (true) {
  console.warn("You are running production build of Inferno in development mode. Use dev:module entry point.");
}

// node_modules/inferno-create-element/dist/index.esm.js
function isNullOrUndef2(o) {
  return o === undefined || o === null;
}
function isString2(o) {
  return typeof o === "string";
}
function isUndefined2(o) {
  return o === undefined;
}
var componentHooks = {
  onComponentDidAppear: 1,
  onComponentDidMount: 1,
  onComponentDidUpdate: 1,
  onComponentShouldUpdate: 1,
  onComponentWillDisappear: 1,
  onComponentWillMount: 1,
  onComponentWillUnmount: 1,
  onComponentWillUpdate: 1
};
function createElement(type, props, _children) {
  var children;
  var ref = null;
  var key = null;
  var className = null;
  var flags;
  var newProps;
  var childLen = arguments.length - 2;
  if (childLen === 1) {
    children = _children;
  } else if (childLen > 1) {
    children = [];
    while (childLen-- > 0) {
      children[childLen] = arguments[childLen + 2];
    }
  }
  if (isString2(type)) {
    flags = getFlagsForElementVnode(type);
    if (!isNullOrUndef2(props)) {
      newProps = {};
      for (var prop in props) {
        if (prop === "className" || prop === "class") {
          className = props[prop];
        } else if (prop === "key") {
          key = props.key;
        } else if (prop === "children" && isUndefined2(children)) {
          children = props.children;
        } else if (prop === "ref") {
          ref = props.ref;
        } else {
          if (prop === "contenteditable") {
            flags |= 4096;
          }
          newProps[prop] = props[prop];
        }
      }
    }
  } else {
    flags = 2;
    if (!isUndefined2(children)) {
      if (!props) {
        props = {};
      }
      props.children = children;
    }
    if (!isNullOrUndef2(props)) {
      newProps = {};
      for (var _prop in props) {
        if (_prop === "key") {
          key = props.key;
        } else if (_prop === "ref") {
          ref = props.ref;
        } else if (componentHooks[_prop] === 1) {
          if (!ref) {
            ref = {};
          }
          ref[_prop] = props[_prop];
        } else {
          newProps[_prop] = props[_prop];
        }
      }
    }
    return createComponentVNode(flags, type, newProps, key, ref);
  }
  if (flags & 8192) {
    return createFragment(childLen === 1 ? [children] : children, 0, key);
  }
  return createVNode(flags, type, className, children, 0, newProps, key, ref);
}

// src/client/socket.ts
class SocketConnection {
  ws = null;
  handlers = new Set;
  reconnectTimer = null;
  reconnectDelay = 1000;
  _connected = false;
  get connected() {
    return this._connected;
  }
  connect() {
    if (this.ws)
      return;
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${location.host}/ws`;
    this.ws = new WebSocket(url);
    this.ws.onopen = () => {
      this._connected = true;
      this.reconnectDelay = 1000;
      console.log("[Socket] Connected");
    };
    this.ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        for (const handler of this.handlers) {
          handler(event);
        }
      } catch (err) {
        console.error("[Socket] Parse error:", err);
      }
    };
    this.ws.onclose = () => {
      this._connected = false;
      this.ws = null;
      console.log("[Socket] Disconnected, reconnecting...");
      this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      this._connected = false;
    };
  }
  scheduleReconnect() {
    if (this.reconnectTimer)
      return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }
  send(command) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    }
  }
  onEvent(handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
  }
}
var socket = new SocketConnection;

// src/client/store.ts
var DEFAULT_SETTINGS = {
  showSeconds: false,
  use12hClock: false,
  coloredNicks: true,
  showMotd: true,
  statusMessages: "shown",
  nickPostfix: ", ",
  desktopNotifications: false,
  notificationSound: true,
  notifyAllMessages: false,
  highlights: "",
  highlightExceptions: "",
  autocomplete: true,
  awayMessage: ""
};
function loadSettings() {
  try {
    const raw = localStorage.getItem("hyphae:settings");
    if (raw)
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

class Store {
  state = {
    appMode: "home",
    previousMode: "home",
    networks: [],
    activeNetworkId: null,
    activeChannelName: null,
    sidebarOpen: true,
    sidebarWidth: parseInt(localStorage.getItem("hyphae:sidebarWidth") || "240", 10),
    userlistOpen: true,
    connectFormOpen: false,
    settingsOpen: false,
    settingsPage: "app-general",
    nostrPubkey: null,
    profilePanelPubkey: null,
    settings: loadSettings()
  };
  listeners = new Set;
  constructor() {
    socket.onEvent((event) => this.handleServerEvent(event));
  }
  getState() {
    return this.state;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    for (const fn of this.listeners)
      fn();
  }
  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }
  connect(options2) {
    socket.send({ type: "connect", network: options2 });
    this.setState({ connectFormOpen: false });
  }
  disconnect(networkId) {
    socket.send({ type: "disconnect", networkId });
  }
  sendMessage(text) {
    const { activeNetworkId, activeChannelName } = this.state;
    if (!activeNetworkId || !activeChannelName)
      return;
    socket.send({ type: "message", networkId: activeNetworkId, target: activeChannelName, text });
  }
  joinChannel(channel, key) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId)
      return;
    socket.send({ type: "join", networkId: activeNetworkId, channel, key });
  }
  partChannel(channel) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId)
      return;
    socket.send({ type: "part", networkId: activeNetworkId, channel });
  }
  setActiveChannel(networkId, channelName) {
    const network = this.state.networks.find((n) => n.id === networkId);
    if (network) {
      const channel = network.channels.find((c) => c.name === channelName);
      if (channel) {
        channel.unread = 0;
        channel.highlight = 0;
      }
    }
    this.setState({ activeNetworkId: networkId, activeChannelName: channelName });
  }
  toggleSidebar() {
    if (this.state.settingsOpen && this.state.sidebarOpen)
      return;
    this.setState({ sidebarOpen: !this.state.sidebarOpen });
  }
  setSidebarWidth(width) {
    const clamped = Math.max(160, Math.min(420, width));
    localStorage.setItem("hyphae:sidebarWidth", String(clamped));
    this.setState({ sidebarWidth: clamped });
  }
  toggleUserlist() {
    this.setState({ userlistOpen: !this.state.userlistOpen });
  }
  openConnectForm() {
    this.setState({ connectFormOpen: true });
  }
  closeConnectForm() {
    this.setState({ connectFormOpen: false });
  }
  setAppMode(mode) {
    if (mode !== this.state.appMode) {
      this.setState({ appMode: mode, previousMode: this.state.appMode, settingsOpen: false });
    }
  }
  setNostrPubkey(pubkey) {
    this.setState({ nostrPubkey: pubkey });
  }
  openProfile(pubkey) {
    this.setState({ profilePanelPubkey: pubkey });
  }
  closeProfile() {
    this.setState({ profilePanelPubkey: null });
  }
  openSettings(page) {
    let target = page;
    if (!target) {
      if (this.state.appMode === "home")
        target = "app-general";
      else if (this.state.appMode === "irc")
        target = "irc-appearance";
      else if (this.state.appMode === "p2p")
        target = "p2p-profile";
      else
        target = this.state.settingsPage;
    }
    this.setState({
      settingsOpen: true,
      settingsPage: target
    });
  }
  setSettingsPage(page) {
    this.setState({ settingsPage: page });
  }
  closeSettings() {
    this.setState({ settingsOpen: false });
  }
  updateSetting(key, value) {
    const settings = { ...this.state.settings, [key]: value };
    localStorage.setItem("hyphae:settings", JSON.stringify(settings));
    this.setState({ settings });
  }
  nostrRegister(password, nostrId) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId)
      return;
    socket.send({ type: "nostr_register", networkId: activeNetworkId, password, nostrId });
  }
  nostrVerify(account, code) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId)
      return;
    socket.send({ type: "nostr_verify", networkId: activeNetworkId, account, code });
  }
  nostrIdentify(account, password) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId)
      return;
    socket.send({ type: "nostr_identify", networkId: activeNetworkId, account, password });
  }
  sendWhois(nick) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId)
      return;
    socket.send({ type: "whois", networkId: activeNetworkId, nick });
  }
  getActiveNetwork() {
    return this.state.networks.find((n) => n.id === this.state.activeNetworkId);
  }
  getActiveChannel() {
    const network = this.getActiveNetwork();
    if (!network)
      return;
    return network.channels.find((c) => c.name === this.state.activeChannelName);
  }
  handleServerEvent(event) {
    switch (event.type) {
      case "network:new":
        this.onNetworkNew(event.network);
        break;
      case "network:status":
        this.onNetworkStatus(event.networkId, event.connected);
        break;
      case "network:remove":
        this.onNetworkRemove(event.networkId);
        break;
      case "channel:new":
        this.onChannelNew(event.networkId, event.channel);
        break;
      case "channel:remove":
        this.onChannelRemove(event.networkId, event.channelName);
        break;
      case "channel:topic":
        this.onChannelTopic(event.networkId, event.channelName, event.topic, event.setBy);
        break;
      case "channel:users":
        this.onChannelUsers(event.networkId, event.channelName, event.users);
        break;
      case "channel:user_join":
        this.onChannelUserJoin(event.networkId, event.channelName, event.user);
        break;
      case "channel:user_part":
        this.onChannelUserPart(event.networkId, event.channelName, event.nick);
        break;
      case "channel:user_quit":
        this.onUserQuit(event.networkId, event.nick);
        break;
      case "channel:user_nick":
        this.onUserNick(event.networkId, event.oldNick, event.newNick);
        break;
      case "message":
        this.onMessage(event.networkId, event.channelName, event.message);
        break;
      case "motd":
        this.onMotd(event.networkId, event.text);
        break;
      case "error":
        this.onError(event.networkId, event.text);
        break;
      case "nickserv":
        this.onNickServ(event.networkId, event.text);
        break;
      case "whois":
        this.onWhois(event.networkId, event.nick, event.lines);
        break;
    }
  }
  findNetwork(id) {
    return this.state.networks.find((n) => n.id === id);
  }
  findChannel(networkId, channelName) {
    const network = this.findNetwork(networkId);
    return network?.channels.find((c) => c.name === channelName);
  }
  onNetworkNew(network) {
    this.state.networks.push(network);
    if (network.channels.length > 0) {
      this.state.activeNetworkId = network.id;
      this.state.activeChannelName = network.channels[0].name;
    }
    this.notify();
  }
  onNetworkStatus(networkId, connected) {
    const network = this.findNetwork(networkId);
    if (network) {
      network.connected = connected;
      this.notify();
    }
  }
  onNetworkRemove(networkId) {
    this.state.networks = this.state.networks.filter((n) => n.id !== networkId);
    if (this.state.activeNetworkId === networkId) {
      if (this.state.networks.length > 0) {
        this.state.activeNetworkId = this.state.networks[0].id;
        this.state.activeChannelName = this.state.networks[0].channels[0]?.name || null;
      } else {
        this.state.activeNetworkId = null;
        this.state.activeChannelName = null;
        this.state.connectFormOpen = true;
      }
    }
    this.notify();
  }
  onChannelNew(networkId, channel) {
    const network = this.findNetwork(networkId);
    if (!network)
      return;
    if (network.channels.find((c) => c.name === channel.name))
      return;
    network.channels.push(channel);
    this.state.activeNetworkId = networkId;
    this.state.activeChannelName = channel.name;
    this.notify();
  }
  onChannelRemove(networkId, channelName) {
    const network = this.findNetwork(networkId);
    if (!network)
      return;
    network.channels = network.channels.filter((c) => c.name !== channelName);
    if (this.state.activeChannelName === channelName && this.state.activeNetworkId === networkId) {
      this.state.activeChannelName = network.channels[0]?.name || null;
    }
    this.notify();
  }
  onChannelTopic(networkId, channelName, topic, setBy) {
    const channel = this.findChannel(networkId, channelName);
    if (channel) {
      channel.topic = topic;
      if (setBy)
        channel.topicSetBy = setBy;
      this.notify();
    }
  }
  onChannelUsers(networkId, channelName, users) {
    const channel = this.findChannel(networkId, channelName);
    if (channel) {
      channel.users = users;
      this.notify();
    }
  }
  onChannelUserJoin(networkId, channelName, user) {
    const channel = this.findChannel(networkId, channelName);
    if (channel) {
      channel.users[user.nick] = user;
      this.notify();
    }
  }
  onChannelUserPart(networkId, channelName, nick) {
    const channel = this.findChannel(networkId, channelName);
    if (channel) {
      delete channel.users[nick];
      this.notify();
    }
  }
  onUserQuit(networkId, nick) {
    const network = this.findNetwork(networkId);
    if (!network)
      return;
    for (const channel of network.channels) {
      delete channel.users[nick];
    }
    this.notify();
  }
  onUserNick(networkId, oldNick, newNick) {
    const network = this.findNetwork(networkId);
    if (!network)
      return;
    for (const channel of network.channels) {
      if (channel.users[oldNick]) {
        const user = channel.users[oldNick];
        delete channel.users[oldNick];
        user.nick = newNick;
        channel.users[newNick] = user;
      }
    }
    this.notify();
  }
  onMessage(networkId, channelName, message) {
    const network = this.findNetwork(networkId);
    if (!network)
      return;
    let channel = network.channels.find((c) => c.name === channelName);
    if (!channel) {
      channel = {
        name: channelName,
        type: "query",
        topic: "",
        joined: true,
        unread: 0,
        highlight: 0,
        users: {},
        messages: [],
        muted: false
      };
      network.channels.push(channel);
    }
    channel.messages.push(message);
    if (channel.messages.length > 500) {
      channel.messages = channel.messages.slice(-500);
    }
    const isActive = this.state.activeNetworkId === networkId && this.state.activeChannelName === channelName;
    if (!isActive && !message.self) {
      channel.unread++;
      if (message.highlight)
        channel.highlight++;
    }
    this.notify();
  }
  onMotd(networkId, text) {
    const network = this.findNetwork(networkId);
    if (!network)
      return;
    const lobby = network.channels.find((c) => c.type === "lobby");
    if (lobby) {
      lobby.messages.push({
        id: `motd_${Date.now()}`,
        time: Date.now(),
        type: "motd",
        from: "",
        text,
        self: false
      });
      this.notify();
    }
  }
  onError(networkId, text) {
    const network = this.findNetwork(networkId);
    if (!network)
      return;
    const target = this.state.activeChannelName && this.state.activeNetworkId === networkId ? this.findChannel(networkId, this.state.activeChannelName) : network.channels[0];
    if (target) {
      target.messages.push({
        id: `err_${Date.now()}`,
        time: Date.now(),
        type: "error",
        from: "",
        text,
        self: false
      });
      this.notify();
    }
  }
  onNickServ(networkId, text) {
    const network = this.findNetwork(networkId);
    if (!network)
      return;
    const lobby = network.channels.find((c) => c.type === "lobby");
    if (lobby) {
      lobby.messages.push({
        id: `ns_${Date.now()}`,
        time: Date.now(),
        type: "notice",
        from: "NickServ",
        text,
        self: false
      });
      this.notify();
    }
  }
  onWhois(networkId, nick, lines) {
    const network = this.findNetwork(networkId);
    if (!network)
      return;
    const target = this.state.activeNetworkId === networkId && this.state.activeChannelName ? this.findChannel(networkId, this.state.activeChannelName) : network.channels[0];
    if (!target)
      return;
    const text = `WHOIS ${nick}:
${lines.join(`
`)}`;
    target.messages.push({
      id: `whois_${Date.now()}`,
      time: Date.now(),
      type: "whois",
      from: "",
      text,
      self: false
    });
    this.notify();
  }
}
var store = new Store;
// ../kaji/src/relay.ts
var subCounter = 0;
function nextSubId() {
  return `sub_${++subCounter}_${Date.now().toString(36)}`;
}

class Relay {
  url;
  ws = null;
  subscriptions = new Map;
  pendingPublish = new Map;
  pendingMessages = [];
  reconnectTimer = null;
  reconnectDelay = 1000;
  maxReconnectDelay = 60000;
  reconnectAttempts = 0;
  maxReconnectAttempts = 5;
  _status = "disconnected";
  statusListeners = new Set;
  constructor(url) {
    this.url = url.replace(/\/$/, "");
  }
  get status() {
    return this._status;
  }
  setStatus(status) {
    this._status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
  onStatusChange(listener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.setStatus("connecting");
      try {
        this.ws = new WebSocket(this.url);
      } catch (err) {
        this.setStatus("error");
        resolve();
        return;
      }
      let resolved = false;
      this.ws.onopen = () => {
        this.setStatus("connected");
        this.reconnectDelay = 1000;
        this.reconnectAttempts = 0;
        for (const msg of this.pendingMessages) {
          this.ws.send(msg);
        }
        this.pendingMessages = [];
        for (const [id, sub] of this.subscriptions) {
          const msg = JSON.stringify(["REQ", id, ...sub.filters]);
          this.ws.send(msg);
        }
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };
      this.ws.onmessage = (e) => {
        this.handleMessage(e.data);
      };
      this.ws.onerror = () => {
        this.setStatus("error");
      };
      this.ws.onclose = () => {
        this.setStatus("disconnected");
        this.ws = null;
        if (!resolved) {
          resolved = true;
          resolve();
        }
        this.scheduleReconnect();
      };
    });
  }
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }
  scheduleReconnect() {
    if (this.reconnectTimer)
      return;
    this.reconnectAttempts++;
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.warn(`[Relay ${this.url}] Max reconnect attempts (${this.maxReconnectAttempts}) reached, giving up`);
      this.setStatus("error");
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {});
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }
  handleMessage(raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(parsed) || parsed.length < 2)
      return;
    const type = parsed[0];
    switch (type) {
      case "EVENT": {
        const subId = parsed[1];
        const event = parsed[2];
        const sub = this.subscriptions.get(subId);
        if (sub)
          sub.onEvent(event);
        break;
      }
      case "EOSE": {
        const subId = parsed[1];
        const sub = this.subscriptions.get(subId);
        if (sub?.onEose)
          sub.onEose();
        break;
      }
      case "OK": {
        const eventId = parsed[1];
        const pending = this.pendingPublish.get(eventId);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingPublish.delete(eventId);
          pending.resolve({ accepted: !!parsed[2], message: parsed[3] || "" });
        }
        break;
      }
      case "NOTICE": {
        console.warn(`[Relay ${this.url}] NOTICE:`, parsed[1]);
        break;
      }
      case "CLOSED": {
        const subId = parsed[1];
        const message = parsed[2] || "";
        const sub = this.subscriptions.get(subId);
        if (sub?.onClosed)
          sub.onClosed(message);
        this.subscriptions.delete(subId);
        break;
      }
      case "AUTH": {
        break;
      }
    }
  }
  send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this.pendingMessages.push(msg);
    }
  }
  subscribe(filters, onEvent, onEose, onClosed) {
    const id = nextSubId();
    this.subscriptions.set(id, { id, filters, onEvent, onEose, onClosed });
    this.send(JSON.stringify(["REQ", id, ...filters]));
    return id;
  }
  unsubscribe(subId) {
    if (this.subscriptions.has(subId)) {
      this.send(JSON.stringify(["CLOSE", subId]));
      this.subscriptions.delete(subId);
    }
  }
  publish(event) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingPublish.delete(event.id);
        resolve({ accepted: false, message: "timeout" });
      }, 1e4);
      this.pendingPublish.set(event.id, { resolve, timer });
      this.send(JSON.stringify(["EVENT", event]));
    });
  }
  get activeSubscriptions() {
    return this.subscriptions.size;
  }
}
// ../kaji/src/pool.ts
class RelayPool {
  relays = new Map;
  seenEvents = new Set;
  maxSeen = 1e4;
  addRelay(url) {
    const normalized = url.replace(/\/$/, "");
    if (this.relays.has(normalized)) {
      return this.relays.get(normalized);
    }
    const relay = new Relay(normalized);
    this.relays.set(normalized, relay);
    return relay;
  }
  removeRelay(url) {
    const normalized = url.replace(/\/$/, "");
    const relay = this.relays.get(normalized);
    if (relay) {
      relay.disconnect();
      this.relays.delete(normalized);
    }
  }
  getRelay(url) {
    return this.relays.get(url.replace(/\/$/, ""));
  }
  get allRelays() {
    return Array.from(this.relays.values());
  }
  async connectAll() {
    const promises = this.allRelays.map((r) => r.connect().catch((err) => {
      console.warn(`Failed to connect to ${r.url}:`, err);
    }));
    await Promise.allSettled(promises);
  }
  disconnectAll() {
    for (const relay of this.relays.values()) {
      relay.disconnect();
    }
  }
  subscribe(filters, onEvent, onEose) {
    const subIds = new Map;
    const id = `pool_${Date.now().toString(36)}`;
    for (const relay of this.relays.values()) {
      const subId = relay.subscribe(filters, (event) => {
        if (this.seenEvents.has(event.id))
          return;
        this.trackSeen(event.id);
        onEvent(event, relay);
      }, () => {
        if (onEose)
          onEose(relay);
      });
      subIds.set(relay, subId);
    }
    return {
      id,
      unsubscribe: () => {
        for (const [relay, subId] of subIds) {
          relay.unsubscribe(subId);
        }
        subIds.clear();
      }
    };
  }
  async publish(event) {
    const results = new Map;
    const promises = this.allRelays.map(async (relay) => {
      try {
        const result2 = await relay.publish(event);
        results.set(relay.url, result2);
      } catch (err) {
        results.set(relay.url, { accepted: false, message: String(err) });
      }
    });
    await Promise.allSettled(promises);
    return results;
  }
  trackSeen(id) {
    this.seenEvents.add(id);
    if (this.seenEvents.size > this.maxSeen) {
      const iter = this.seenEvents.values();
      for (let i = 0;i < this.maxSeen / 2; i++) {
        const val = iter.next().value;
        if (val)
          this.seenEvents.delete(val);
      }
    }
  }
  getStatus() {
    const statuses = new Map;
    for (const [url, relay] of this.relays) {
      statuses.set(url, relay.status);
    }
    return statuses;
  }
}
// ../kaji/src/profiles.ts
class ProfileStore {
  profiles = new Map;
  listeners = new Set;
  pending = new Set;
  batchQueue = new Set;
  batchTimer = null;
  batchDelay;
  pool;
  constructor(pool, opts) {
    this.pool = pool;
    this.batchDelay = opts?.batchDelay ?? 150;
  }
  notify() {
    for (const fn of this.listeners)
      fn();
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  get(pubkey) {
    return this.profiles.get(pubkey);
  }
  getAll() {
    return this.profiles;
  }
  fetch(pubkey) {
    if (this.profiles.has(pubkey) || this.pending.has(pubkey))
      return;
    this.batchQueue.add(pubkey);
    this.scheduleBatch();
  }
  fetchMany(pubkeys) {
    for (const pk of pubkeys) {
      if (!this.profiles.has(pk) && !this.pending.has(pk)) {
        this.batchQueue.add(pk);
      }
    }
    this.scheduleBatch();
  }
  set(profile) {
    const existing = this.profiles.get(profile.pubkey);
    if (!existing || profile.lastUpdated > existing.lastUpdated) {
      this.profiles.set(profile.pubkey, profile);
      this.notify();
    }
  }
  scheduleBatch() {
    if (this.batchTimer)
      return;
    this.batchTimer = setTimeout(() => {
      this.batchTimer = null;
      this.flushBatch();
    }, this.batchDelay);
  }
  flushBatch() {
    const toFetch = Array.from(this.batchQueue).filter((pk) => !this.profiles.has(pk) && !this.pending.has(pk));
    this.batchQueue.clear();
    if (toFetch.length === 0)
      return;
    for (const pk of toFetch)
      this.pending.add(pk);
    const sub = this.pool.subscribe([{ kinds: [0], authors: toFetch }], (event) => {
      const existing = this.profiles.get(event.pubkey);
      if (!existing || event.created_at > existing.lastUpdated) {
        this.profiles.set(event.pubkey, parseProfileEvent(event));
        this.notify();
      }
    }, () => {
      sub.unsubscribe();
      for (const pk of toFetch)
        this.pending.delete(pk);
    });
  }
}
function parseProfileEvent(event) {
  let meta = {};
  try {
    meta = JSON.parse(event.content);
  } catch {}
  return {
    pubkey: event.pubkey,
    name: meta.name || "",
    displayName: meta.display_name || meta.displayName || "",
    about: meta.about || "",
    picture: meta.picture || "",
    banner: meta.banner || "",
    nip05: meta.nip05 || "",
    lud16: meta.lud16 || "",
    lastUpdated: event.created_at
  };
}
// src/client/nostr.ts
var DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://purplepag.es",
  "wss://relay.nostr.net"
];

class NostrManager {
  pool;
  profileStore;
  _pubkey = null;
  _connected = false;
  listeners = new Set;
  constructor() {
    this.pool = new RelayPool;
    for (const url of DEFAULT_RELAYS) {
      this.pool.addRelay(url);
    }
    this.profileStore = new ProfileStore(this.pool);
    this.profileStore.subscribe(() => this.notify());
  }
  get pubkey() {
    return this._pubkey;
  }
  get connected() {
    return this._connected;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    for (const fn of this.listeners)
      fn();
  }
  async connect() {
    if (this._connected)
      return;
    await this.pool.connectAll();
    this._connected = true;
  }
  async loginWithExtension() {
    if (typeof window === "undefined" || !window.nostr) {
      throw new Error("No NIP-07 extension found. Install Alby or nos2x.");
    }
    const pubkey = await window.nostr.getPublicKey();
    this._pubkey = pubkey;
    await this.connect();
    this.profileStore.fetch(pubkey);
    this.notify();
    return pubkey;
  }
  getProfile(pubkey) {
    return this.profileStore.get(pubkey);
  }
  fetchProfile(pubkey) {
    if (!this._connected) {
      this.connect().then(() => {
        this.profileStore.fetch(pubkey);
      });
    } else {
      this.profileStore.fetch(pubkey);
    }
  }
  fetchProfiles(pubkeys) {
    if (!this._connected) {
      this.connect().then(() => {
        this.profileStore.fetchMany(pubkeys);
      });
    } else {
      this.profileStore.fetchMany(pubkeys);
    }
  }
  disconnect() {
    this.pool.disconnectAll();
    this._connected = false;
  }
}
var nostr = new NostrManager;

// src/client/keybinds.ts
function getAllChannels() {
  const state = store.getState();
  const result2 = [];
  for (const network of state.networks) {
    for (const channel of network.channels) {
      result2.push({ networkId: network.id, channelName: channel.name });
    }
  }
  return result2;
}
function navigateChannel(direction) {
  const state = store.getState();
  const channels = getAllChannels();
  if (channels.length === 0)
    return;
  let index = channels.findIndex((c) => c.networkId === state.activeNetworkId && c.channelName === state.activeChannelName);
  const length = channels.length;
  index = ((index + direction) % length + length) % length;
  const target = channels[index];
  store.setActiveChannel(target.networkId, target.channelName);
}
function jumpToUnread() {
  const state = store.getState();
  let target = null;
  for (const network of state.networks) {
    for (const chan of network.channels) {
      if (chan.highlight > 0) {
        target = { networkId: network.id, channelName: chan.name };
        break;
      }
      if (chan.unread > 0 && !target) {
        target = { networkId: network.id, channelName: chan.name };
      }
    }
    if (target && state.networks.some((n) => n.channels.some((c) => c.highlight > 0)))
      break;
  }
  if (target) {
    store.setActiveChannel(target.networkId, target.channelName);
  }
}
var ignoredKeys = {
  8: true,
  9: true,
  12: true,
  16: true,
  17: true,
  18: true,
  19: true,
  20: true,
  27: true,
  35: true,
  36: true,
  37: true,
  38: true,
  39: true,
  40: true,
  45: true,
  46: true,
  112: true,
  113: true,
  114: true,
  115: true,
  116: true,
  117: true,
  118: true,
  119: true,
  120: true,
  121: true,
  122: true,
  123: true,
  144: true,
  145: true,
  224: true
};
function initKeybinds() {
  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      navigateChannel(e.key === "ArrowUp" ? -1 : 1);
      return;
    }
    if (e.altKey && e.key === "a") {
      e.preventDefault();
      jumpToUnread();
      return;
    }
    if (e.key === "Escape") {
      const state = store.getState();
      if (state.profilePanelPubkey) {
        store.closeProfile();
        return;
      }
      if (state.connectFormOpen && state.networks.length > 0) {
        store.closeConnectForm();
        return;
      }
    }
    if (e.altKey || ignoredKeys[e.which])
      return;
    if ((e.ctrlKey || e.metaKey) && e.which !== 86)
      return;
    if (e.key === "PageUp" || e.key === "PageDown") {
      const chat = document.getElementById("messages-scroll");
      if (chat)
        chat.focus();
      return;
    }
    const tagName = e.target.tagName;
    if (tagName === "INPUT" || tagName === "TEXTAREA")
      return;
    const input = document.querySelector('input[name="message"]');
    if (input) {
      input.focus();
      if (e.key === "Enter")
        e.preventDefault();
    }
  });
}

// node_modules/clsx/dist/clsx.mjs
function r(e) {
  var t, f, n = "";
  if (typeof e == "string" || typeof e == "number")
    n += e;
  else if (typeof e == "object")
    if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0;t < o; t++)
        e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
    } else
      for (f in e)
        e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length;f < o; f++)
    (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}

// node_modules/tailwind-merge/dist/bundle-mjs.mjs
var concatArrays = (array1, array2) => {
  const combinedArray = new Array(array1.length + array2.length);
  for (let i = 0;i < array1.length; i++) {
    combinedArray[i] = array1[i];
  }
  for (let i = 0;i < array2.length; i++) {
    combinedArray[array1.length + i] = array2[i];
  }
  return combinedArray;
};
var createClassValidatorObject = (classGroupId, validator) => ({
  classGroupId,
  validator
});
var createClassPartObject = (nextPart = new Map, validators = null, classGroupId) => ({
  nextPart,
  validators,
  classGroupId
});
var CLASS_PART_SEPARATOR = "-";
var EMPTY_CONFLICTS = [];
var ARBITRARY_PROPERTY_PREFIX = "arbitrary..";
var createClassGroupUtils = (config) => {
  const classMap = createClassMap(config);
  const {
    conflictingClassGroups,
    conflictingClassGroupModifiers
  } = config;
  const getClassGroupId = (className) => {
    if (className.startsWith("[") && className.endsWith("]")) {
      return getGroupIdForArbitraryProperty(className);
    }
    const classParts = className.split(CLASS_PART_SEPARATOR);
    const startIndex = classParts[0] === "" && classParts.length > 1 ? 1 : 0;
    return getGroupRecursive(classParts, startIndex, classMap);
  };
  const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
    if (hasPostfixModifier) {
      const modifierConflicts = conflictingClassGroupModifiers[classGroupId];
      const baseConflicts = conflictingClassGroups[classGroupId];
      if (modifierConflicts) {
        if (baseConflicts) {
          return concatArrays(baseConflicts, modifierConflicts);
        }
        return modifierConflicts;
      }
      return baseConflicts || EMPTY_CONFLICTS;
    }
    return conflictingClassGroups[classGroupId] || EMPTY_CONFLICTS;
  };
  return {
    getClassGroupId,
    getConflictingClassGroupIds
  };
};
var getGroupRecursive = (classParts, startIndex, classPartObject) => {
  const classPathsLength = classParts.length - startIndex;
  if (classPathsLength === 0) {
    return classPartObject.classGroupId;
  }
  const currentClassPart = classParts[startIndex];
  const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
  if (nextClassPartObject) {
    const result2 = getGroupRecursive(classParts, startIndex + 1, nextClassPartObject);
    if (result2)
      return result2;
  }
  const validators = classPartObject.validators;
  if (validators === null) {
    return;
  }
  const classRest = startIndex === 0 ? classParts.join(CLASS_PART_SEPARATOR) : classParts.slice(startIndex).join(CLASS_PART_SEPARATOR);
  const validatorsLength = validators.length;
  for (let i = 0;i < validatorsLength; i++) {
    const validatorObj = validators[i];
    if (validatorObj.validator(classRest)) {
      return validatorObj.classGroupId;
    }
  }
  return;
};
var getGroupIdForArbitraryProperty = (className) => className.slice(1, -1).indexOf(":") === -1 ? undefined : (() => {
  const content = className.slice(1, -1);
  const colonIndex = content.indexOf(":");
  const property = content.slice(0, colonIndex);
  return property ? ARBITRARY_PROPERTY_PREFIX + property : undefined;
})();
var createClassMap = (config) => {
  const {
    theme,
    classGroups
  } = config;
  return processClassGroups(classGroups, theme);
};
var processClassGroups = (classGroups, theme) => {
  const classMap = createClassPartObject();
  for (const classGroupId in classGroups) {
    const group = classGroups[classGroupId];
    processClassesRecursively(group, classMap, classGroupId, theme);
  }
  return classMap;
};
var processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
  const len = classGroup.length;
  for (let i = 0;i < len; i++) {
    const classDefinition = classGroup[i];
    processClassDefinition(classDefinition, classPartObject, classGroupId, theme);
  }
};
var processClassDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
  if (typeof classDefinition === "string") {
    processStringDefinition(classDefinition, classPartObject, classGroupId);
    return;
  }
  if (typeof classDefinition === "function") {
    processFunctionDefinition(classDefinition, classPartObject, classGroupId, theme);
    return;
  }
  processObjectDefinition(classDefinition, classPartObject, classGroupId, theme);
};
var processStringDefinition = (classDefinition, classPartObject, classGroupId) => {
  const classPartObjectToEdit = classDefinition === "" ? classPartObject : getPart(classPartObject, classDefinition);
  classPartObjectToEdit.classGroupId = classGroupId;
};
var processFunctionDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
  if (isThemeGetter(classDefinition)) {
    processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
    return;
  }
  if (classPartObject.validators === null) {
    classPartObject.validators = [];
  }
  classPartObject.validators.push(createClassValidatorObject(classGroupId, classDefinition));
};
var processObjectDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
  const entries = Object.entries(classDefinition);
  const len = entries.length;
  for (let i = 0;i < len; i++) {
    const [key, value] = entries[i];
    processClassesRecursively(value, getPart(classPartObject, key), classGroupId, theme);
  }
};
var getPart = (classPartObject, path) => {
  let current = classPartObject;
  const parts = path.split(CLASS_PART_SEPARATOR);
  const len = parts.length;
  for (let i = 0;i < len; i++) {
    const part = parts[i];
    let next = current.nextPart.get(part);
    if (!next) {
      next = createClassPartObject();
      current.nextPart.set(part, next);
    }
    current = next;
  }
  return current;
};
var isThemeGetter = (func) => ("isThemeGetter" in func) && func.isThemeGetter === true;
var createLruCache = (maxCacheSize) => {
  if (maxCacheSize < 1) {
    return {
      get: () => {
        return;
      },
      set: () => {}
    };
  }
  let cacheSize = 0;
  let cache = Object.create(null);
  let previousCache = Object.create(null);
  const update = (key, value) => {
    cache[key] = value;
    cacheSize++;
    if (cacheSize > maxCacheSize) {
      cacheSize = 0;
      previousCache = cache;
      cache = Object.create(null);
    }
  };
  return {
    get(key) {
      let value = cache[key];
      if (value !== undefined) {
        return value;
      }
      if ((value = previousCache[key]) !== undefined) {
        update(key, value);
        return value;
      }
    },
    set(key, value) {
      if (key in cache) {
        cache[key] = value;
      } else {
        update(key, value);
      }
    }
  };
};
var IMPORTANT_MODIFIER = "!";
var MODIFIER_SEPARATOR = ":";
var EMPTY_MODIFIERS = [];
var createResultObject = (modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition, isExternal) => ({
  modifiers,
  hasImportantModifier,
  baseClassName,
  maybePostfixModifierPosition,
  isExternal
});
var createParseClassName = (config) => {
  const {
    prefix,
    experimentalParseClassName
  } = config;
  let parseClassName = (className) => {
    const modifiers = [];
    let bracketDepth = 0;
    let parenDepth = 0;
    let modifierStart = 0;
    let postfixModifierPosition;
    const len = className.length;
    for (let index = 0;index < len; index++) {
      const currentCharacter = className[index];
      if (bracketDepth === 0 && parenDepth === 0) {
        if (currentCharacter === MODIFIER_SEPARATOR) {
          modifiers.push(className.slice(modifierStart, index));
          modifierStart = index + 1;
          continue;
        }
        if (currentCharacter === "/") {
          postfixModifierPosition = index;
          continue;
        }
      }
      if (currentCharacter === "[")
        bracketDepth++;
      else if (currentCharacter === "]")
        bracketDepth--;
      else if (currentCharacter === "(")
        parenDepth++;
      else if (currentCharacter === ")")
        parenDepth--;
    }
    const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.slice(modifierStart);
    let baseClassName = baseClassNameWithImportantModifier;
    let hasImportantModifier = false;
    if (baseClassNameWithImportantModifier.endsWith(IMPORTANT_MODIFIER)) {
      baseClassName = baseClassNameWithImportantModifier.slice(0, -1);
      hasImportantModifier = true;
    } else if (baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER)) {
      baseClassName = baseClassNameWithImportantModifier.slice(1);
      hasImportantModifier = true;
    }
    const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : undefined;
    return createResultObject(modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition);
  };
  if (prefix) {
    const fullPrefix = prefix + MODIFIER_SEPARATOR;
    const parseClassNameOriginal = parseClassName;
    parseClassName = (className) => className.startsWith(fullPrefix) ? parseClassNameOriginal(className.slice(fullPrefix.length)) : createResultObject(EMPTY_MODIFIERS, false, className, undefined, true);
  }
  if (experimentalParseClassName) {
    const parseClassNameOriginal = parseClassName;
    parseClassName = (className) => experimentalParseClassName({
      className,
      parseClassName: parseClassNameOriginal
    });
  }
  return parseClassName;
};
var createSortModifiers = (config) => {
  const modifierWeights = new Map;
  config.orderSensitiveModifiers.forEach((mod, index) => {
    modifierWeights.set(mod, 1e6 + index);
  });
  return (modifiers) => {
    const result2 = [];
    let currentSegment = [];
    for (let i = 0;i < modifiers.length; i++) {
      const modifier = modifiers[i];
      const isArbitrary = modifier[0] === "[";
      const isOrderSensitive = modifierWeights.has(modifier);
      if (isArbitrary || isOrderSensitive) {
        if (currentSegment.length > 0) {
          currentSegment.sort();
          result2.push(...currentSegment);
          currentSegment = [];
        }
        result2.push(modifier);
      } else {
        currentSegment.push(modifier);
      }
    }
    if (currentSegment.length > 0) {
      currentSegment.sort();
      result2.push(...currentSegment);
    }
    return result2;
  };
};
var createConfigUtils = (config) => ({
  cache: createLruCache(config.cacheSize),
  parseClassName: createParseClassName(config),
  sortModifiers: createSortModifiers(config),
  ...createClassGroupUtils(config)
});
var SPLIT_CLASSES_REGEX = /\s+/;
var mergeClassList = (classList, configUtils) => {
  const {
    parseClassName,
    getClassGroupId,
    getConflictingClassGroupIds,
    sortModifiers
  } = configUtils;
  const classGroupsInConflict = [];
  const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
  let result2 = "";
  for (let index = classNames.length - 1;index >= 0; index -= 1) {
    const originalClassName = classNames[index];
    const {
      isExternal,
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition
    } = parseClassName(originalClassName);
    if (isExternal) {
      result2 = originalClassName + (result2.length > 0 ? " " + result2 : result2);
      continue;
    }
    let hasPostfixModifier = !!maybePostfixModifierPosition;
    let classGroupId = getClassGroupId(hasPostfixModifier ? baseClassName.substring(0, maybePostfixModifierPosition) : baseClassName);
    if (!classGroupId) {
      if (!hasPostfixModifier) {
        result2 = originalClassName + (result2.length > 0 ? " " + result2 : result2);
        continue;
      }
      classGroupId = getClassGroupId(baseClassName);
      if (!classGroupId) {
        result2 = originalClassName + (result2.length > 0 ? " " + result2 : result2);
        continue;
      }
      hasPostfixModifier = false;
    }
    const variantModifier = modifiers.length === 0 ? "" : modifiers.length === 1 ? modifiers[0] : sortModifiers(modifiers).join(":");
    const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER : variantModifier;
    const classId = modifierId + classGroupId;
    if (classGroupsInConflict.indexOf(classId) > -1) {
      continue;
    }
    classGroupsInConflict.push(classId);
    const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
    for (let i = 0;i < conflictGroups.length; ++i) {
      const group = conflictGroups[i];
      classGroupsInConflict.push(modifierId + group);
    }
    result2 = originalClassName + (result2.length > 0 ? " " + result2 : result2);
  }
  return result2;
};
var twJoin = (...classLists) => {
  let index = 0;
  let argument;
  let resolvedValue;
  let string = "";
  while (index < classLists.length) {
    if (argument = classLists[index++]) {
      if (resolvedValue = toValue(argument)) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
};
var toValue = (mix) => {
  if (typeof mix === "string") {
    return mix;
  }
  let resolvedValue;
  let string = "";
  for (let k = 0;k < mix.length; k++) {
    if (mix[k]) {
      if (resolvedValue = toValue(mix[k])) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
};
var createTailwindMerge = (createConfigFirst, ...createConfigRest) => {
  let configUtils;
  let cacheGet;
  let cacheSet;
  let functionToCall;
  const initTailwindMerge = (classList) => {
    const config = createConfigRest.reduce((previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig), createConfigFirst());
    configUtils = createConfigUtils(config);
    cacheGet = configUtils.cache.get;
    cacheSet = configUtils.cache.set;
    functionToCall = tailwindMerge;
    return tailwindMerge(classList);
  };
  const tailwindMerge = (classList) => {
    const cachedResult = cacheGet(classList);
    if (cachedResult) {
      return cachedResult;
    }
    const result2 = mergeClassList(classList, configUtils);
    cacheSet(classList, result2);
    return result2;
  };
  functionToCall = initTailwindMerge;
  return (...args) => functionToCall(twJoin(...args));
};
var fallbackThemeArr = [];
var fromTheme = (key) => {
  const themeGetter = (theme) => theme[key] || fallbackThemeArr;
  themeGetter.isThemeGetter = true;
  return themeGetter;
};
var arbitraryValueRegex = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
var arbitraryVariableRegex = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
var fractionRegex = /^\d+\/\d+$/;
var tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
var lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
var colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
var shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
var imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
var isFraction = (value) => fractionRegex.test(value);
var isNumber2 = (value) => !!value && !Number.isNaN(Number(value));
var isInteger = (value) => !!value && Number.isInteger(Number(value));
var isPercent = (value) => value.endsWith("%") && isNumber2(value.slice(0, -1));
var isTshirtSize = (value) => tshirtUnitRegex.test(value);
var isAny = () => true;
var isLengthOnly = (value) => lengthUnitRegex.test(value) && !colorFunctionRegex.test(value);
var isNever = () => false;
var isShadow = (value) => shadowRegex.test(value);
var isImage = (value) => imageRegex.test(value);
var isAnyNonArbitrary = (value) => !isArbitraryValue(value) && !isArbitraryVariable(value);
var isArbitrarySize = (value) => getIsArbitraryValue(value, isLabelSize, isNever);
var isArbitraryValue = (value) => arbitraryValueRegex.test(value);
var isArbitraryLength = (value) => getIsArbitraryValue(value, isLabelLength, isLengthOnly);
var isArbitraryNumber = (value) => getIsArbitraryValue(value, isLabelNumber, isNumber2);
var isArbitraryWeight = (value) => getIsArbitraryValue(value, isLabelWeight, isAny);
var isArbitraryFamilyName = (value) => getIsArbitraryValue(value, isLabelFamilyName, isNever);
var isArbitraryPosition = (value) => getIsArbitraryValue(value, isLabelPosition, isNever);
var isArbitraryImage = (value) => getIsArbitraryValue(value, isLabelImage, isImage);
var isArbitraryShadow = (value) => getIsArbitraryValue(value, isLabelShadow, isShadow);
var isArbitraryVariable = (value) => arbitraryVariableRegex.test(value);
var isArbitraryVariableLength = (value) => getIsArbitraryVariable(value, isLabelLength);
var isArbitraryVariableFamilyName = (value) => getIsArbitraryVariable(value, isLabelFamilyName);
var isArbitraryVariablePosition = (value) => getIsArbitraryVariable(value, isLabelPosition);
var isArbitraryVariableSize = (value) => getIsArbitraryVariable(value, isLabelSize);
var isArbitraryVariableImage = (value) => getIsArbitraryVariable(value, isLabelImage);
var isArbitraryVariableShadow = (value) => getIsArbitraryVariable(value, isLabelShadow, true);
var isArbitraryVariableWeight = (value) => getIsArbitraryVariable(value, isLabelWeight, true);
var getIsArbitraryValue = (value, testLabel, testValue) => {
  const result2 = arbitraryValueRegex.exec(value);
  if (result2) {
    if (result2[1]) {
      return testLabel(result2[1]);
    }
    return testValue(result2[2]);
  }
  return false;
};
var getIsArbitraryVariable = (value, testLabel, shouldMatchNoLabel = false) => {
  const result2 = arbitraryVariableRegex.exec(value);
  if (result2) {
    if (result2[1]) {
      return testLabel(result2[1]);
    }
    return shouldMatchNoLabel;
  }
  return false;
};
var isLabelPosition = (label) => label === "position" || label === "percentage";
var isLabelImage = (label) => label === "image" || label === "url";
var isLabelSize = (label) => label === "length" || label === "size" || label === "bg-size";
var isLabelLength = (label) => label === "length";
var isLabelNumber = (label) => label === "number";
var isLabelFamilyName = (label) => label === "family-name";
var isLabelWeight = (label) => label === "number" || label === "weight";
var isLabelShadow = (label) => label === "shadow";
var getDefaultConfig = () => {
  const themeColor = fromTheme("color");
  const themeFont = fromTheme("font");
  const themeText = fromTheme("text");
  const themeFontWeight = fromTheme("font-weight");
  const themeTracking = fromTheme("tracking");
  const themeLeading = fromTheme("leading");
  const themeBreakpoint = fromTheme("breakpoint");
  const themeContainer = fromTheme("container");
  const themeSpacing = fromTheme("spacing");
  const themeRadius = fromTheme("radius");
  const themeShadow = fromTheme("shadow");
  const themeInsetShadow = fromTheme("inset-shadow");
  const themeTextShadow = fromTheme("text-shadow");
  const themeDropShadow = fromTheme("drop-shadow");
  const themeBlur = fromTheme("blur");
  const themePerspective = fromTheme("perspective");
  const themeAspect = fromTheme("aspect");
  const themeEase = fromTheme("ease");
  const themeAnimate = fromTheme("animate");
  const scaleBreak = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"];
  const scalePosition = () => [
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top-left",
    "left-top",
    "top-right",
    "right-top",
    "bottom-right",
    "right-bottom",
    "bottom-left",
    "left-bottom"
  ];
  const scalePositionWithArbitrary = () => [...scalePosition(), isArbitraryVariable, isArbitraryValue];
  const scaleOverflow = () => ["auto", "hidden", "clip", "visible", "scroll"];
  const scaleOverscroll = () => ["auto", "contain", "none"];
  const scaleUnambiguousSpacing = () => [isArbitraryVariable, isArbitraryValue, themeSpacing];
  const scaleInset = () => [isFraction, "full", "auto", ...scaleUnambiguousSpacing()];
  const scaleGridTemplateColsRows = () => [isInteger, "none", "subgrid", isArbitraryVariable, isArbitraryValue];
  const scaleGridColRowStartAndEnd = () => ["auto", {
    span: ["full", isInteger, isArbitraryVariable, isArbitraryValue]
  }, isInteger, isArbitraryVariable, isArbitraryValue];
  const scaleGridColRowStartOrEnd = () => [isInteger, "auto", isArbitraryVariable, isArbitraryValue];
  const scaleGridAutoColsRows = () => ["auto", "min", "max", "fr", isArbitraryVariable, isArbitraryValue];
  const scaleAlignPrimaryAxis = () => ["start", "end", "center", "between", "around", "evenly", "stretch", "baseline", "center-safe", "end-safe"];
  const scaleAlignSecondaryAxis = () => ["start", "end", "center", "stretch", "center-safe", "end-safe"];
  const scaleMargin = () => ["auto", ...scaleUnambiguousSpacing()];
  const scaleSizing = () => [isFraction, "auto", "full", "dvw", "dvh", "lvw", "lvh", "svw", "svh", "min", "max", "fit", ...scaleUnambiguousSpacing()];
  const scaleColor = () => [themeColor, isArbitraryVariable, isArbitraryValue];
  const scaleBgPosition = () => [...scalePosition(), isArbitraryVariablePosition, isArbitraryPosition, {
    position: [isArbitraryVariable, isArbitraryValue]
  }];
  const scaleBgRepeat = () => ["no-repeat", {
    repeat: ["", "x", "y", "space", "round"]
  }];
  const scaleBgSize = () => ["auto", "cover", "contain", isArbitraryVariableSize, isArbitrarySize, {
    size: [isArbitraryVariable, isArbitraryValue]
  }];
  const scaleGradientStopPosition = () => [isPercent, isArbitraryVariableLength, isArbitraryLength];
  const scaleRadius = () => [
    "",
    "none",
    "full",
    themeRadius,
    isArbitraryVariable,
    isArbitraryValue
  ];
  const scaleBorderWidth = () => ["", isNumber2, isArbitraryVariableLength, isArbitraryLength];
  const scaleLineStyle = () => ["solid", "dashed", "dotted", "double"];
  const scaleBlendMode = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
  const scaleMaskImagePosition = () => [isNumber2, isPercent, isArbitraryVariablePosition, isArbitraryPosition];
  const scaleBlur = () => [
    "",
    "none",
    themeBlur,
    isArbitraryVariable,
    isArbitraryValue
  ];
  const scaleRotate = () => ["none", isNumber2, isArbitraryVariable, isArbitraryValue];
  const scaleScale = () => ["none", isNumber2, isArbitraryVariable, isArbitraryValue];
  const scaleSkew = () => [isNumber2, isArbitraryVariable, isArbitraryValue];
  const scaleTranslate = () => [isFraction, "full", ...scaleUnambiguousSpacing()];
  return {
    cacheSize: 500,
    theme: {
      animate: ["spin", "ping", "pulse", "bounce"],
      aspect: ["video"],
      blur: [isTshirtSize],
      breakpoint: [isTshirtSize],
      color: [isAny],
      container: [isTshirtSize],
      "drop-shadow": [isTshirtSize],
      ease: ["in", "out", "in-out"],
      font: [isAnyNonArbitrary],
      "font-weight": ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black"],
      "inset-shadow": [isTshirtSize],
      leading: ["none", "tight", "snug", "normal", "relaxed", "loose"],
      perspective: ["dramatic", "near", "normal", "midrange", "distant", "none"],
      radius: [isTshirtSize],
      shadow: [isTshirtSize],
      spacing: ["px", isNumber2],
      text: [isTshirtSize],
      "text-shadow": [isTshirtSize],
      tracking: ["tighter", "tight", "normal", "wide", "wider", "widest"]
    },
    classGroups: {
      aspect: [{
        aspect: ["auto", "square", isFraction, isArbitraryValue, isArbitraryVariable, themeAspect]
      }],
      container: ["container"],
      columns: [{
        columns: [isNumber2, isArbitraryValue, isArbitraryVariable, themeContainer]
      }],
      "break-after": [{
        "break-after": scaleBreak()
      }],
      "break-before": [{
        "break-before": scaleBreak()
      }],
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      box: [{
        box: ["border", "content"]
      }],
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      sr: ["sr-only", "not-sr-only"],
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      isolation: ["isolate", "isolation-auto"],
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      "object-position": [{
        object: scalePositionWithArbitrary()
      }],
      overflow: [{
        overflow: scaleOverflow()
      }],
      "overflow-x": [{
        "overflow-x": scaleOverflow()
      }],
      "overflow-y": [{
        "overflow-y": scaleOverflow()
      }],
      overscroll: [{
        overscroll: scaleOverscroll()
      }],
      "overscroll-x": [{
        "overscroll-x": scaleOverscroll()
      }],
      "overscroll-y": [{
        "overscroll-y": scaleOverscroll()
      }],
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      inset: [{
        inset: scaleInset()
      }],
      "inset-x": [{
        "inset-x": scaleInset()
      }],
      "inset-y": [{
        "inset-y": scaleInset()
      }],
      start: [{
        start: scaleInset()
      }],
      end: [{
        end: scaleInset()
      }],
      top: [{
        top: scaleInset()
      }],
      right: [{
        right: scaleInset()
      }],
      bottom: [{
        bottom: scaleInset()
      }],
      left: [{
        left: scaleInset()
      }],
      visibility: ["visible", "invisible", "collapse"],
      z: [{
        z: [isInteger, "auto", isArbitraryVariable, isArbitraryValue]
      }],
      basis: [{
        basis: [isFraction, "full", "auto", themeContainer, ...scaleUnambiguousSpacing()]
      }],
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      "flex-wrap": [{
        flex: ["nowrap", "wrap", "wrap-reverse"]
      }],
      flex: [{
        flex: [isNumber2, isFraction, "auto", "initial", "none", isArbitraryValue]
      }],
      grow: [{
        grow: ["", isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      shrink: [{
        shrink: ["", isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      order: [{
        order: [isInteger, "first", "last", "none", isArbitraryVariable, isArbitraryValue]
      }],
      "grid-cols": [{
        "grid-cols": scaleGridTemplateColsRows()
      }],
      "col-start-end": [{
        col: scaleGridColRowStartAndEnd()
      }],
      "col-start": [{
        "col-start": scaleGridColRowStartOrEnd()
      }],
      "col-end": [{
        "col-end": scaleGridColRowStartOrEnd()
      }],
      "grid-rows": [{
        "grid-rows": scaleGridTemplateColsRows()
      }],
      "row-start-end": [{
        row: scaleGridColRowStartAndEnd()
      }],
      "row-start": [{
        "row-start": scaleGridColRowStartOrEnd()
      }],
      "row-end": [{
        "row-end": scaleGridColRowStartOrEnd()
      }],
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      "auto-cols": [{
        "auto-cols": scaleGridAutoColsRows()
      }],
      "auto-rows": [{
        "auto-rows": scaleGridAutoColsRows()
      }],
      gap: [{
        gap: scaleUnambiguousSpacing()
      }],
      "gap-x": [{
        "gap-x": scaleUnambiguousSpacing()
      }],
      "gap-y": [{
        "gap-y": scaleUnambiguousSpacing()
      }],
      "justify-content": [{
        justify: [...scaleAlignPrimaryAxis(), "normal"]
      }],
      "justify-items": [{
        "justify-items": [...scaleAlignSecondaryAxis(), "normal"]
      }],
      "justify-self": [{
        "justify-self": ["auto", ...scaleAlignSecondaryAxis()]
      }],
      "align-content": [{
        content: ["normal", ...scaleAlignPrimaryAxis()]
      }],
      "align-items": [{
        items: [...scaleAlignSecondaryAxis(), {
          baseline: ["", "last"]
        }]
      }],
      "align-self": [{
        self: ["auto", ...scaleAlignSecondaryAxis(), {
          baseline: ["", "last"]
        }]
      }],
      "place-content": [{
        "place-content": scaleAlignPrimaryAxis()
      }],
      "place-items": [{
        "place-items": [...scaleAlignSecondaryAxis(), "baseline"]
      }],
      "place-self": [{
        "place-self": ["auto", ...scaleAlignSecondaryAxis()]
      }],
      p: [{
        p: scaleUnambiguousSpacing()
      }],
      px: [{
        px: scaleUnambiguousSpacing()
      }],
      py: [{
        py: scaleUnambiguousSpacing()
      }],
      ps: [{
        ps: scaleUnambiguousSpacing()
      }],
      pe: [{
        pe: scaleUnambiguousSpacing()
      }],
      pt: [{
        pt: scaleUnambiguousSpacing()
      }],
      pr: [{
        pr: scaleUnambiguousSpacing()
      }],
      pb: [{
        pb: scaleUnambiguousSpacing()
      }],
      pl: [{
        pl: scaleUnambiguousSpacing()
      }],
      m: [{
        m: scaleMargin()
      }],
      mx: [{
        mx: scaleMargin()
      }],
      my: [{
        my: scaleMargin()
      }],
      ms: [{
        ms: scaleMargin()
      }],
      me: [{
        me: scaleMargin()
      }],
      mt: [{
        mt: scaleMargin()
      }],
      mr: [{
        mr: scaleMargin()
      }],
      mb: [{
        mb: scaleMargin()
      }],
      ml: [{
        ml: scaleMargin()
      }],
      "space-x": [{
        "space-x": scaleUnambiguousSpacing()
      }],
      "space-x-reverse": ["space-x-reverse"],
      "space-y": [{
        "space-y": scaleUnambiguousSpacing()
      }],
      "space-y-reverse": ["space-y-reverse"],
      size: [{
        size: scaleSizing()
      }],
      w: [{
        w: [themeContainer, "screen", ...scaleSizing()]
      }],
      "min-w": [{
        "min-w": [
          themeContainer,
          "screen",
          "none",
          ...scaleSizing()
        ]
      }],
      "max-w": [{
        "max-w": [
          themeContainer,
          "screen",
          "none",
          "prose",
          {
            screen: [themeBreakpoint]
          },
          ...scaleSizing()
        ]
      }],
      h: [{
        h: ["screen", "lh", ...scaleSizing()]
      }],
      "min-h": [{
        "min-h": ["screen", "lh", "none", ...scaleSizing()]
      }],
      "max-h": [{
        "max-h": ["screen", "lh", ...scaleSizing()]
      }],
      "font-size": [{
        text: ["base", themeText, isArbitraryVariableLength, isArbitraryLength]
      }],
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      "font-style": ["italic", "not-italic"],
      "font-weight": [{
        font: [themeFontWeight, isArbitraryVariableWeight, isArbitraryWeight]
      }],
      "font-stretch": [{
        "font-stretch": ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded", "extra-expanded", "ultra-expanded", isPercent, isArbitraryValue]
      }],
      "font-family": [{
        font: [isArbitraryVariableFamilyName, isArbitraryFamilyName, themeFont]
      }],
      "fvn-normal": ["normal-nums"],
      "fvn-ordinal": ["ordinal"],
      "fvn-slashed-zero": ["slashed-zero"],
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      tracking: [{
        tracking: [themeTracking, isArbitraryVariable, isArbitraryValue]
      }],
      "line-clamp": [{
        "line-clamp": [isNumber2, "none", isArbitraryVariable, isArbitraryNumber]
      }],
      leading: [{
        leading: [
          themeLeading,
          ...scaleUnambiguousSpacing()
        ]
      }],
      "list-image": [{
        "list-image": ["none", isArbitraryVariable, isArbitraryValue]
      }],
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      "list-style-type": [{
        list: ["disc", "decimal", "none", isArbitraryVariable, isArbitraryValue]
      }],
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      "placeholder-color": [{
        placeholder: scaleColor()
      }],
      "text-color": [{
        text: scaleColor()
      }],
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      "text-decoration-style": [{
        decoration: [...scaleLineStyle(), "wavy"]
      }],
      "text-decoration-thickness": [{
        decoration: [isNumber2, "from-font", "auto", isArbitraryVariable, isArbitraryLength]
      }],
      "text-decoration-color": [{
        decoration: scaleColor()
      }],
      "underline-offset": [{
        "underline-offset": [isNumber2, "auto", isArbitraryVariable, isArbitraryValue]
      }],
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      indent: [{
        indent: scaleUnambiguousSpacing()
      }],
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", isArbitraryVariable, isArbitraryValue]
      }],
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      wrap: [{
        wrap: ["break-word", "anywhere", "normal"]
      }],
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      content: [{
        content: ["none", isArbitraryVariable, isArbitraryValue]
      }],
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      "bg-position": [{
        bg: scaleBgPosition()
      }],
      "bg-repeat": [{
        bg: scaleBgRepeat()
      }],
      "bg-size": [{
        bg: scaleBgSize()
      }],
      "bg-image": [{
        bg: ["none", {
          linear: [{
            to: ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
          }, isInteger, isArbitraryVariable, isArbitraryValue],
          radial: ["", isArbitraryVariable, isArbitraryValue],
          conic: [isInteger, isArbitraryVariable, isArbitraryValue]
        }, isArbitraryVariableImage, isArbitraryImage]
      }],
      "bg-color": [{
        bg: scaleColor()
      }],
      "gradient-from-pos": [{
        from: scaleGradientStopPosition()
      }],
      "gradient-via-pos": [{
        via: scaleGradientStopPosition()
      }],
      "gradient-to-pos": [{
        to: scaleGradientStopPosition()
      }],
      "gradient-from": [{
        from: scaleColor()
      }],
      "gradient-via": [{
        via: scaleColor()
      }],
      "gradient-to": [{
        to: scaleColor()
      }],
      rounded: [{
        rounded: scaleRadius()
      }],
      "rounded-s": [{
        "rounded-s": scaleRadius()
      }],
      "rounded-e": [{
        "rounded-e": scaleRadius()
      }],
      "rounded-t": [{
        "rounded-t": scaleRadius()
      }],
      "rounded-r": [{
        "rounded-r": scaleRadius()
      }],
      "rounded-b": [{
        "rounded-b": scaleRadius()
      }],
      "rounded-l": [{
        "rounded-l": scaleRadius()
      }],
      "rounded-ss": [{
        "rounded-ss": scaleRadius()
      }],
      "rounded-se": [{
        "rounded-se": scaleRadius()
      }],
      "rounded-ee": [{
        "rounded-ee": scaleRadius()
      }],
      "rounded-es": [{
        "rounded-es": scaleRadius()
      }],
      "rounded-tl": [{
        "rounded-tl": scaleRadius()
      }],
      "rounded-tr": [{
        "rounded-tr": scaleRadius()
      }],
      "rounded-br": [{
        "rounded-br": scaleRadius()
      }],
      "rounded-bl": [{
        "rounded-bl": scaleRadius()
      }],
      "border-w": [{
        border: scaleBorderWidth()
      }],
      "border-w-x": [{
        "border-x": scaleBorderWidth()
      }],
      "border-w-y": [{
        "border-y": scaleBorderWidth()
      }],
      "border-w-s": [{
        "border-s": scaleBorderWidth()
      }],
      "border-w-e": [{
        "border-e": scaleBorderWidth()
      }],
      "border-w-t": [{
        "border-t": scaleBorderWidth()
      }],
      "border-w-r": [{
        "border-r": scaleBorderWidth()
      }],
      "border-w-b": [{
        "border-b": scaleBorderWidth()
      }],
      "border-w-l": [{
        "border-l": scaleBorderWidth()
      }],
      "divide-x": [{
        "divide-x": scaleBorderWidth()
      }],
      "divide-x-reverse": ["divide-x-reverse"],
      "divide-y": [{
        "divide-y": scaleBorderWidth()
      }],
      "divide-y-reverse": ["divide-y-reverse"],
      "border-style": [{
        border: [...scaleLineStyle(), "hidden", "none"]
      }],
      "divide-style": [{
        divide: [...scaleLineStyle(), "hidden", "none"]
      }],
      "border-color": [{
        border: scaleColor()
      }],
      "border-color-x": [{
        "border-x": scaleColor()
      }],
      "border-color-y": [{
        "border-y": scaleColor()
      }],
      "border-color-s": [{
        "border-s": scaleColor()
      }],
      "border-color-e": [{
        "border-e": scaleColor()
      }],
      "border-color-t": [{
        "border-t": scaleColor()
      }],
      "border-color-r": [{
        "border-r": scaleColor()
      }],
      "border-color-b": [{
        "border-b": scaleColor()
      }],
      "border-color-l": [{
        "border-l": scaleColor()
      }],
      "divide-color": [{
        divide: scaleColor()
      }],
      "outline-style": [{
        outline: [...scaleLineStyle(), "none", "hidden"]
      }],
      "outline-offset": [{
        "outline-offset": [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "outline-w": [{
        outline: ["", isNumber2, isArbitraryVariableLength, isArbitraryLength]
      }],
      "outline-color": [{
        outline: scaleColor()
      }],
      shadow: [{
        shadow: [
          "",
          "none",
          themeShadow,
          isArbitraryVariableShadow,
          isArbitraryShadow
        ]
      }],
      "shadow-color": [{
        shadow: scaleColor()
      }],
      "inset-shadow": [{
        "inset-shadow": ["none", themeInsetShadow, isArbitraryVariableShadow, isArbitraryShadow]
      }],
      "inset-shadow-color": [{
        "inset-shadow": scaleColor()
      }],
      "ring-w": [{
        ring: scaleBorderWidth()
      }],
      "ring-w-inset": ["ring-inset"],
      "ring-color": [{
        ring: scaleColor()
      }],
      "ring-offset-w": [{
        "ring-offset": [isNumber2, isArbitraryLength]
      }],
      "ring-offset-color": [{
        "ring-offset": scaleColor()
      }],
      "inset-ring-w": [{
        "inset-ring": scaleBorderWidth()
      }],
      "inset-ring-color": [{
        "inset-ring": scaleColor()
      }],
      "text-shadow": [{
        "text-shadow": ["none", themeTextShadow, isArbitraryVariableShadow, isArbitraryShadow]
      }],
      "text-shadow-color": [{
        "text-shadow": scaleColor()
      }],
      opacity: [{
        opacity: [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "mix-blend": [{
        "mix-blend": [...scaleBlendMode(), "plus-darker", "plus-lighter"]
      }],
      "bg-blend": [{
        "bg-blend": scaleBlendMode()
      }],
      "mask-clip": [{
        "mask-clip": ["border", "padding", "content", "fill", "stroke", "view"]
      }, "mask-no-clip"],
      "mask-composite": [{
        mask: ["add", "subtract", "intersect", "exclude"]
      }],
      "mask-image-linear-pos": [{
        "mask-linear": [isNumber2]
      }],
      "mask-image-linear-from-pos": [{
        "mask-linear-from": scaleMaskImagePosition()
      }],
      "mask-image-linear-to-pos": [{
        "mask-linear-to": scaleMaskImagePosition()
      }],
      "mask-image-linear-from-color": [{
        "mask-linear-from": scaleColor()
      }],
      "mask-image-linear-to-color": [{
        "mask-linear-to": scaleColor()
      }],
      "mask-image-t-from-pos": [{
        "mask-t-from": scaleMaskImagePosition()
      }],
      "mask-image-t-to-pos": [{
        "mask-t-to": scaleMaskImagePosition()
      }],
      "mask-image-t-from-color": [{
        "mask-t-from": scaleColor()
      }],
      "mask-image-t-to-color": [{
        "mask-t-to": scaleColor()
      }],
      "mask-image-r-from-pos": [{
        "mask-r-from": scaleMaskImagePosition()
      }],
      "mask-image-r-to-pos": [{
        "mask-r-to": scaleMaskImagePosition()
      }],
      "mask-image-r-from-color": [{
        "mask-r-from": scaleColor()
      }],
      "mask-image-r-to-color": [{
        "mask-r-to": scaleColor()
      }],
      "mask-image-b-from-pos": [{
        "mask-b-from": scaleMaskImagePosition()
      }],
      "mask-image-b-to-pos": [{
        "mask-b-to": scaleMaskImagePosition()
      }],
      "mask-image-b-from-color": [{
        "mask-b-from": scaleColor()
      }],
      "mask-image-b-to-color": [{
        "mask-b-to": scaleColor()
      }],
      "mask-image-l-from-pos": [{
        "mask-l-from": scaleMaskImagePosition()
      }],
      "mask-image-l-to-pos": [{
        "mask-l-to": scaleMaskImagePosition()
      }],
      "mask-image-l-from-color": [{
        "mask-l-from": scaleColor()
      }],
      "mask-image-l-to-color": [{
        "mask-l-to": scaleColor()
      }],
      "mask-image-x-from-pos": [{
        "mask-x-from": scaleMaskImagePosition()
      }],
      "mask-image-x-to-pos": [{
        "mask-x-to": scaleMaskImagePosition()
      }],
      "mask-image-x-from-color": [{
        "mask-x-from": scaleColor()
      }],
      "mask-image-x-to-color": [{
        "mask-x-to": scaleColor()
      }],
      "mask-image-y-from-pos": [{
        "mask-y-from": scaleMaskImagePosition()
      }],
      "mask-image-y-to-pos": [{
        "mask-y-to": scaleMaskImagePosition()
      }],
      "mask-image-y-from-color": [{
        "mask-y-from": scaleColor()
      }],
      "mask-image-y-to-color": [{
        "mask-y-to": scaleColor()
      }],
      "mask-image-radial": [{
        "mask-radial": [isArbitraryVariable, isArbitraryValue]
      }],
      "mask-image-radial-from-pos": [{
        "mask-radial-from": scaleMaskImagePosition()
      }],
      "mask-image-radial-to-pos": [{
        "mask-radial-to": scaleMaskImagePosition()
      }],
      "mask-image-radial-from-color": [{
        "mask-radial-from": scaleColor()
      }],
      "mask-image-radial-to-color": [{
        "mask-radial-to": scaleColor()
      }],
      "mask-image-radial-shape": [{
        "mask-radial": ["circle", "ellipse"]
      }],
      "mask-image-radial-size": [{
        "mask-radial": [{
          closest: ["side", "corner"],
          farthest: ["side", "corner"]
        }]
      }],
      "mask-image-radial-pos": [{
        "mask-radial-at": scalePosition()
      }],
      "mask-image-conic-pos": [{
        "mask-conic": [isNumber2]
      }],
      "mask-image-conic-from-pos": [{
        "mask-conic-from": scaleMaskImagePosition()
      }],
      "mask-image-conic-to-pos": [{
        "mask-conic-to": scaleMaskImagePosition()
      }],
      "mask-image-conic-from-color": [{
        "mask-conic-from": scaleColor()
      }],
      "mask-image-conic-to-color": [{
        "mask-conic-to": scaleColor()
      }],
      "mask-mode": [{
        mask: ["alpha", "luminance", "match"]
      }],
      "mask-origin": [{
        "mask-origin": ["border", "padding", "content", "fill", "stroke", "view"]
      }],
      "mask-position": [{
        mask: scaleBgPosition()
      }],
      "mask-repeat": [{
        mask: scaleBgRepeat()
      }],
      "mask-size": [{
        mask: scaleBgSize()
      }],
      "mask-type": [{
        "mask-type": ["alpha", "luminance"]
      }],
      "mask-image": [{
        mask: ["none", isArbitraryVariable, isArbitraryValue]
      }],
      filter: [{
        filter: [
          "",
          "none",
          isArbitraryVariable,
          isArbitraryValue
        ]
      }],
      blur: [{
        blur: scaleBlur()
      }],
      brightness: [{
        brightness: [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      contrast: [{
        contrast: [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "drop-shadow": [{
        "drop-shadow": [
          "",
          "none",
          themeDropShadow,
          isArbitraryVariableShadow,
          isArbitraryShadow
        ]
      }],
      "drop-shadow-color": [{
        "drop-shadow": scaleColor()
      }],
      grayscale: [{
        grayscale: ["", isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "hue-rotate": [{
        "hue-rotate": [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      invert: [{
        invert: ["", isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      saturate: [{
        saturate: [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      sepia: [{
        sepia: ["", isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "backdrop-filter": [{
        "backdrop-filter": [
          "",
          "none",
          isArbitraryVariable,
          isArbitraryValue
        ]
      }],
      "backdrop-blur": [{
        "backdrop-blur": scaleBlur()
      }],
      "backdrop-brightness": [{
        "backdrop-brightness": [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "backdrop-contrast": [{
        "backdrop-contrast": [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "backdrop-grayscale": [{
        "backdrop-grayscale": ["", isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "backdrop-invert": [{
        "backdrop-invert": ["", isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "backdrop-opacity": [{
        "backdrop-opacity": [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "backdrop-saturate": [{
        "backdrop-saturate": [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "backdrop-sepia": [{
        "backdrop-sepia": ["", isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      "border-spacing": [{
        "border-spacing": scaleUnambiguousSpacing()
      }],
      "border-spacing-x": [{
        "border-spacing-x": scaleUnambiguousSpacing()
      }],
      "border-spacing-y": [{
        "border-spacing-y": scaleUnambiguousSpacing()
      }],
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      caption: [{
        caption: ["top", "bottom"]
      }],
      transition: [{
        transition: ["", "all", "colors", "opacity", "shadow", "transform", "none", isArbitraryVariable, isArbitraryValue]
      }],
      "transition-behavior": [{
        transition: ["normal", "discrete"]
      }],
      duration: [{
        duration: [isNumber2, "initial", isArbitraryVariable, isArbitraryValue]
      }],
      ease: [{
        ease: ["linear", "initial", themeEase, isArbitraryVariable, isArbitraryValue]
      }],
      delay: [{
        delay: [isNumber2, isArbitraryVariable, isArbitraryValue]
      }],
      animate: [{
        animate: ["none", themeAnimate, isArbitraryVariable, isArbitraryValue]
      }],
      backface: [{
        backface: ["hidden", "visible"]
      }],
      perspective: [{
        perspective: [themePerspective, isArbitraryVariable, isArbitraryValue]
      }],
      "perspective-origin": [{
        "perspective-origin": scalePositionWithArbitrary()
      }],
      rotate: [{
        rotate: scaleRotate()
      }],
      "rotate-x": [{
        "rotate-x": scaleRotate()
      }],
      "rotate-y": [{
        "rotate-y": scaleRotate()
      }],
      "rotate-z": [{
        "rotate-z": scaleRotate()
      }],
      scale: [{
        scale: scaleScale()
      }],
      "scale-x": [{
        "scale-x": scaleScale()
      }],
      "scale-y": [{
        "scale-y": scaleScale()
      }],
      "scale-z": [{
        "scale-z": scaleScale()
      }],
      "scale-3d": ["scale-3d"],
      skew: [{
        skew: scaleSkew()
      }],
      "skew-x": [{
        "skew-x": scaleSkew()
      }],
      "skew-y": [{
        "skew-y": scaleSkew()
      }],
      transform: [{
        transform: [isArbitraryVariable, isArbitraryValue, "", "none", "gpu", "cpu"]
      }],
      "transform-origin": [{
        origin: scalePositionWithArbitrary()
      }],
      "transform-style": [{
        transform: ["3d", "flat"]
      }],
      translate: [{
        translate: scaleTranslate()
      }],
      "translate-x": [{
        "translate-x": scaleTranslate()
      }],
      "translate-y": [{
        "translate-y": scaleTranslate()
      }],
      "translate-z": [{
        "translate-z": scaleTranslate()
      }],
      "translate-none": ["translate-none"],
      accent: [{
        accent: scaleColor()
      }],
      appearance: [{
        appearance: ["none", "auto"]
      }],
      "caret-color": [{
        caret: scaleColor()
      }],
      "color-scheme": [{
        scheme: ["normal", "dark", "light", "light-dark", "only-dark", "only-light"]
      }],
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", isArbitraryVariable, isArbitraryValue]
      }],
      "field-sizing": [{
        "field-sizing": ["fixed", "content"]
      }],
      "pointer-events": [{
        "pointer-events": ["auto", "none"]
      }],
      resize: [{
        resize: ["none", "", "y", "x"]
      }],
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      "scroll-m": [{
        "scroll-m": scaleUnambiguousSpacing()
      }],
      "scroll-mx": [{
        "scroll-mx": scaleUnambiguousSpacing()
      }],
      "scroll-my": [{
        "scroll-my": scaleUnambiguousSpacing()
      }],
      "scroll-ms": [{
        "scroll-ms": scaleUnambiguousSpacing()
      }],
      "scroll-me": [{
        "scroll-me": scaleUnambiguousSpacing()
      }],
      "scroll-mt": [{
        "scroll-mt": scaleUnambiguousSpacing()
      }],
      "scroll-mr": [{
        "scroll-mr": scaleUnambiguousSpacing()
      }],
      "scroll-mb": [{
        "scroll-mb": scaleUnambiguousSpacing()
      }],
      "scroll-ml": [{
        "scroll-ml": scaleUnambiguousSpacing()
      }],
      "scroll-p": [{
        "scroll-p": scaleUnambiguousSpacing()
      }],
      "scroll-px": [{
        "scroll-px": scaleUnambiguousSpacing()
      }],
      "scroll-py": [{
        "scroll-py": scaleUnambiguousSpacing()
      }],
      "scroll-ps": [{
        "scroll-ps": scaleUnambiguousSpacing()
      }],
      "scroll-pe": [{
        "scroll-pe": scaleUnambiguousSpacing()
      }],
      "scroll-pt": [{
        "scroll-pt": scaleUnambiguousSpacing()
      }],
      "scroll-pr": [{
        "scroll-pr": scaleUnambiguousSpacing()
      }],
      "scroll-pb": [{
        "scroll-pb": scaleUnambiguousSpacing()
      }],
      "scroll-pl": [{
        "scroll-pl": scaleUnambiguousSpacing()
      }],
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      "touch-pz": ["touch-pinch-zoom"],
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", isArbitraryVariable, isArbitraryValue]
      }],
      fill: [{
        fill: ["none", ...scaleColor()]
      }],
      "stroke-w": [{
        stroke: [isNumber2, isArbitraryVariableLength, isArbitraryLength, isArbitraryNumber]
      }],
      stroke: [{
        stroke: ["none", ...scaleColor()]
      }],
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-x", "border-w-y", "border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-x", "border-color-y", "border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      translate: ["translate-x", "translate-y", "translate-none"],
      "translate-none": ["translate", "translate-x", "translate-y", "translate-z"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    },
    orderSensitiveModifiers: ["*", "**", "after", "backdrop", "before", "details-content", "file", "first-letter", "first-line", "marker", "placeholder", "selection"]
  };
};
var twMerge = /* @__PURE__ */ createTailwindMerge(getDefaultConfig);

// src/lib/utils.ts
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// node_modules/uuid/dist/stringify.js
var byteToHex = [];
for (let i = 0;i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
    getRandomValues = crypto.getRandomValues.bind(crypto);
  }
  return getRandomValues(rnds8);
}

// node_modules/uuid/dist/native.js
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native_default = { randomUUID };

// node_modules/uuid/dist/v4.js
function _v4(options2, buf, offset) {
  options2 = options2 || {};
  const rnds = options2.random ?? options2.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0;i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
function v4(options2, buf, offset) {
  if (native_default.randomUUID && !buf && !options2) {
    return native_default.randomUUID();
  }
  return _v4(options2, buf, offset);
}
var v4_default = v4;
// src/client/p2p/models/settings.ts
var ColorMode;
((ColorMode2) => {
  ColorMode2["DARK"] = "dark";
  ColorMode2["LIGHT"] = "light";
})(ColorMode ||= {});
var ColorModeValueStrings = Object.values(ColorMode).map(String);

// src/client/p2p/models/chat.ts
var isMessageReceived = (message) => ("timeReceived" in message);
var isSystemMessage = (message) => {
  return "type" in message && message.type === "system";
};

// src/client/p2p/services/Encryption.ts
var arrayBufferToBase64 = (buffer) => {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return btoa(binary);
};
var base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0;i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};
var algorithmName = "RSA-OAEP";
var algorithmHash = "SHA-256";

class EncryptionService {
  cryptoKeyStub = {
    algorithm: { name: "STUB-ALGORITHM" },
    extractable: false,
    type: "private",
    usages: []
  };
  generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey({
      name: algorithmName,
      hash: algorithmHash,
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1])
    }, true, ["encrypt", "decrypt"]);
    return keyPair;
  };
  encodePassword = async (roomId, password) => {
    const data = new TextEncoder().encode(`${roomId}_${password}`);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(digest);
    const encodedPassword = window.btoa(String.fromCharCode(...bytes));
    return encodedPassword;
  };
  stringifyCryptoKey = async (cryptoKey) => {
    const exportedKey = await window.crypto.subtle.exportKey(cryptoKey.type === "public" ? "spki" : "pkcs8", cryptoKey);
    const exportedKeyAsString = arrayBufferToBase64(exportedKey);
    return exportedKeyAsString;
  };
  parseCryptoKeyString = async (keyString, type) => {
    const importedKey = await window.crypto.subtle.importKey(type === 0 /* PUBLIC */ ? "spki" : "pkcs8", base64ToArrayBuffer(keyString), {
      name: algorithmName,
      hash: algorithmHash
    }, true, type === 0 /* PUBLIC */ ? ["encrypt"] : ["decrypt"]);
    return importedKey;
  };
  encryptString = async (publicKey, plaintext) => {
    const encodedText = new TextEncoder().encode(plaintext);
    const encryptedData = await crypto.subtle.encrypt(algorithmName, publicKey, encodedText);
    return encryptedData;
  };
  decryptString = async (privateKey, encryptedData) => {
    const decryptedArrayBuffer = await crypto.subtle.decrypt(algorithmName, privateKey, encryptedData);
    const decryptedString = new TextDecoder().decode(decryptedArrayBuffer);
    return decryptedString;
  };
}
var encryption = new EncryptionService;

// src/client/p2p/services/Serialization.ts
class SerializationService {
  serializeUserSettings = async (userSettings) => {
    const {
      publicKey: publicCryptoKey,
      privateKey: privateCryptoKey,
      ...userSettingsRest
    } = userSettings;
    const publicKey = await encryption.stringifyCryptoKey(publicCryptoKey);
    const privateKey = await encryption.stringifyCryptoKey(privateCryptoKey);
    return {
      ...userSettingsRest,
      publicKey,
      privateKey
    };
  };
  deserializeUserSettings = async (serializedUserSettings) => {
    const {
      publicKey: publicCryptoKeyString,
      privateKey: privateCryptoKeyString,
      ...userSettingsForIndexedDbRest
    } = serializedUserSettings;
    const publicKey = await encryption.parseCryptoKeyString(publicCryptoKeyString, 0 /* PUBLIC */);
    const privateKey = await encryption.parseCryptoKeyString(privateCryptoKeyString, 1 /* PRIVATE */);
    return {
      ...userSettingsForIndexedDbRest,
      publicKey,
      privateKey
    };
  };
}
var serialization = new SerializationService;

// src/client/p2p/config/soundNames.ts
var soundOptions = [
  { label: "New Message", value: "/sounds/new-message.aac" },
  { label: "Chime", value: "/sounds/chime.mp3" },
  { label: "Beep", value: "/sounds/beep.mp3" }
];
var DEFAULT_SOUND = soundOptions.find((sound) => sound.label === "New Message")?.value || "/sounds/new-message.aac";

// src/client/p2p/p2pStore.ts
class P2PStore {
  state = {
    initialized: false,
    errorMessage: null,
    userSettings: null,
    roomId: undefined,
    password: undefined,
    peerList: [],
    peerConnectionTypes: {},
    messageLog: [],
    selfAudioState: "STOPPED" /* STOPPED */,
    selfVideoState: "STOPPED" /* STOPPED */,
    selfScreenShareState: "NOT_SHARING" /* NOT_SHARING */,
    localAudioStream: null,
    localVideoStream: null,
    localScreenStream: null,
    peerStreams: {},
    fileOffers: [],
    isFileTransferOpen: false,
    directMessages: {},
    activeDmPeerId: null,
    dmUnreadCounts: {},
    joinedRooms: [],
    activeRoomName: null,
    title: "P2P Chat",
    alertText: "",
    alertSeverity: "info",
    isAlertShowing: false,
    unreadCount: 0
  };
  listeners = new Set;
  getState() {
    return this.state;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  notify() {
    for (const listener of this.listeners)
      listener();
  }
  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }
  async init() {
    try {
      const { publicKey, privateKey } = await encryption.generateKeyPair();
      const defaultSettings = {
        userId: v4_default(),
        customUsername: "",
        colorMode: "dark" /* DARK */,
        playSoundOnNewMessage: true,
        showNotificationOnNewMessage: true,
        showActiveTypingStatus: true,
        isEnhancedConnectivityEnabled: true,
        publicKey,
        privateKey,
        selectedSound: DEFAULT_SOUND
      };
      const raw = localStorage.getItem("chitchatter:settings");
      let userSettings = defaultSettings;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const deserialized = await serialization.deserializeUserSettings(parsed);
          userSettings = { ...defaultSettings, ...deserialized };
        } catch (e) {
          console.warn("Failed to load P2P settings, using defaults", e);
        }
      }
      this.setState({ userSettings, initialized: true });
      await this.persistSettings(userSettings);
      if (userSettings.showNotificationOnNewMessage && typeof Notification !== "undefined") {
        Notification.requestPermission().catch(() => {});
      }
    } catch (e) {
      console.error(e);
      this.setState({ errorMessage: "P2P chat failed to initialize.", initialized: true });
    }
  }
  async persistSettings(settings) {
    try {
      const serialized = await serialization.serializeUserSettings(settings);
      localStorage.setItem("chitchatter:settings", JSON.stringify(serialized));
    } catch (e) {
      console.warn("Failed to persist P2P settings", e);
    }
  }
  async updateSettings(changes) {
    if (!this.state.userSettings)
      return;
    const newSettings = { ...this.state.userSettings, ...changes };
    this.setState({ userSettings: newSettings });
    await this.persistSettings(newSettings);
  }
  setRoomId(roomId) {
    this.setState({ roomId });
  }
  setPassword(password) {
    this.setState({ password });
  }
  setPeerList(peerList) {
    this.setState({ peerList });
  }
  addPeer(peer) {
    this.setState({ peerList: [...this.state.peerList, peer] });
  }
  removePeer(peerId) {
    this.setState({ peerList: this.state.peerList.filter((p2) => p2.peerId !== peerId) });
  }
  updatePeer(peerId, updates) {
    const idx = this.state.peerList.findIndex((p2) => p2.peerId === peerId);
    if (idx === -1)
      return;
    const list = [...this.state.peerList];
    list[idx] = { ...list[idx], ...updates };
    this.setState({ peerList: list });
  }
  setMessageLog(messages) {
    this.setState({ messageLog: messages });
  }
  addMessage(message) {
    const newLog = [...this.state.messageLog, message];
    const updates = { messageLog: newLog };
    if (document.hidden) {
      const count = this.state.unreadCount + 1;
      updates.unreadCount = count;
    }
    this.setState(updates);
  }
  addSystemMessage(text) {
    const msg = {
      id: v4_default(),
      type: "system",
      text,
      timeSent: Date.now(),
      authorId: "__system__"
    };
    this.addMessage(msg);
  }
  resetUnread() {
    if (this.state.unreadCount > 0)
      this.setState({ unreadCount: 0 });
  }
  setPeerConnectionTypes(types) {
    this.setState({ peerConnectionTypes: types });
  }
  setSelfAudioState(state) {
    this.setState({ selfAudioState: state });
  }
  setSelfVideoState(state) {
    this.setState({ selfVideoState: state });
  }
  setSelfScreenShareState(state) {
    this.setState({ selfScreenShareState: state });
  }
  setLocalAudioStream(stream) {
    this.setState({ localAudioStream: stream });
  }
  setLocalVideoStream(stream) {
    this.setState({ localVideoStream: stream });
  }
  setLocalScreenStream(stream) {
    this.setState({ localScreenStream: stream });
  }
  addPeerStream(peerId, stream, type) {
    const current = { ...this.state.peerStreams };
    if (!current[peerId])
      current[peerId] = [];
    current[peerId] = current[peerId].filter((s) => s.type !== type);
    current[peerId].push({ peerId, stream, type });
    this.setState({ peerStreams: current });
  }
  removePeerStream(peerId, type) {
    const current = { ...this.state.peerStreams };
    if (!current[peerId])
      return;
    current[peerId] = current[peerId].filter((s) => s.type !== type);
    if (current[peerId].length === 0)
      delete current[peerId];
    this.setState({ peerStreams: current });
  }
  removePeerStreams(peerId) {
    const current = { ...this.state.peerStreams };
    delete current[peerId];
    this.setState({ peerStreams: current });
  }
  addFileOffer(offer) {
    this.setState({ fileOffers: [...this.state.fileOffers, offer] });
  }
  updateFileOffer(id, updates) {
    const offers = this.state.fileOffers.map((o) => o.id === id ? { ...o, ...updates } : o);
    this.setState({ fileOffers: offers });
  }
  removeFileOffer(id) {
    this.setState({ fileOffers: this.state.fileOffers.filter((o) => o.id !== id) });
  }
  toggleFileTransfer() {
    this.setState({ isFileTransferOpen: !this.state.isFileTransferOpen });
  }
  openDm(peerId) {
    const counts = { ...this.state.dmUnreadCounts };
    delete counts[peerId];
    this.setState({ activeDmPeerId: peerId, dmUnreadCounts: counts });
  }
  closeDm() {
    this.setState({ activeDmPeerId: null });
  }
  addDirectMessage(peerId, message) {
    const dms = { ...this.state.directMessages };
    if (!dms[peerId])
      dms[peerId] = [];
    dms[peerId] = [...dms[peerId], message];
    const counts = { ...this.state.dmUnreadCounts };
    if (this.state.activeDmPeerId !== peerId) {
      counts[peerId] = (counts[peerId] || 0) + 1;
    }
    this.setState({ directMessages: dms, dmUnreadCounts: counts });
  }
  clearDirectMessages(peerId) {
    const dms = { ...this.state.directMessages };
    delete dms[peerId];
    const counts = { ...this.state.dmUnreadCounts };
    delete counts[peerId];
    this.setState({ directMessages: dms, dmUnreadCounts: counts });
  }
  resetMediaState() {
    this.state.localAudioStream?.getTracks().forEach((t) => t.stop());
    this.state.localVideoStream?.getTracks().forEach((t) => t.stop());
    this.state.localScreenStream?.getTracks().forEach((t) => t.stop());
    this.setState({
      selfAudioState: "STOPPED" /* STOPPED */,
      selfVideoState: "STOPPED" /* STOPPED */,
      selfScreenShareState: "NOT_SHARING" /* NOT_SHARING */,
      localAudioStream: null,
      localVideoStream: null,
      localScreenStream: null,
      peerStreams: {}
    });
  }
  addJoinedRoom(name, isPrivate) {
    const id = `${isPrivate ? "private" : "public"}:${name}`;
    if (this.state.joinedRooms.some((r2) => r2.id === id))
      return;
    this.setState({
      joinedRooms: [...this.state.joinedRooms, { id, name, isPrivate }],
      activeRoomName: name
    });
  }
  removeJoinedRoom(name) {
    this.setState({
      joinedRooms: this.state.joinedRooms.filter((r2) => r2.name !== name),
      activeRoomName: this.state.activeRoomName === name ? null : this.state.activeRoomName
    });
  }
  setActiveRoom(name) {
    this.setState({ activeRoomName: name });
  }
  setTitle(title) {
    this.setState({ title });
  }
  alertTimer = null;
  showAlert(text, severity = "info") {
    if (this.alertTimer)
      clearTimeout(this.alertTimer);
    this.setState({ alertText: text, alertSeverity: severity, isAlertShowing: true });
    this.alertTimer = setTimeout(() => this.hideAlert(), 3000);
  }
  hideAlert() {
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }
    this.setState({ isAlertShowing: false });
  }
}
var p2pStore = new P2PStore;

// ../blazecn/node_modules/inferno/dist/index.esm.js
var isArray2 = Array.isArray;
function isStringOrNumber2(o) {
  var type = typeof o;
  return type === "string" || type === "number";
}
function isNullOrUndef3(o) {
  return o === undefined || o === null;
}
function isInvalid2(o) {
  return o === null || o === false || o === true || o === undefined;
}
function isFunction2(o) {
  return typeof o === "function";
}
function isString3(o) {
  return typeof o === "string";
}
function isNumber3(o) {
  return typeof o === "number";
}
function isNull2(o) {
  return o === null;
}
function isUndefined3(o) {
  return o === undefined;
}
function combineFrom2(first, second) {
  var out = {};
  if (first) {
    for (var key in first) {
      out[key] = first[key];
    }
  }
  if (second) {
    for (var _key in second) {
      out[_key] = second[_key];
    }
  }
  return out;
}
function isLinkEventObject2(o) {
  return !isNull2(o) && typeof o === "object";
}
var EMPTY_OBJ2 = {};
var Fragment2 = "$F";
var AnimationQueues3 = function AnimationQueues4() {
  this.componentDidAppear = [];
  this.componentWillDisappear = [];
  this.componentWillMove = [];
};
function normalizeEventName2(name) {
  return name.substring(2).toLowerCase();
}
function appendChild2(parentDOM, dom) {
  parentDOM.appendChild(dom);
}
function insertOrAppend2(parentDOM, newNode, nextNode) {
  if (isNull2(nextNode)) {
    appendChild2(parentDOM, newNode);
  } else {
    parentDOM.insertBefore(newNode, nextNode);
  }
}
function documentCreateElement2(tag, isSVG) {
  if (isSVG) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }
  return document.createElement(tag);
}
function replaceChild2(parentDOM, newDom, lastDom) {
  parentDOM.replaceChild(newDom, lastDom);
}
function removeChild2(parentDOM, childNode) {
  parentDOM.removeChild(childNode);
}
function callAll2(arrayFn) {
  for (var i = 0;i < arrayFn.length; i++) {
    arrayFn[i]();
  }
}
function findChildVNode2(vNode, startEdge, flags) {
  var children = vNode.children;
  if (flags & 4) {
    return children.$LI;
  }
  if (flags & 8192) {
    return vNode.childFlags === 2 ? children : children[startEdge ? 0 : children.length - 1];
  }
  return children;
}
function findDOMFromVNode2(vNode, startEdge) {
  var flags;
  while (vNode) {
    flags = vNode.flags;
    if (flags & 1521) {
      return vNode.dom;
    }
    vNode = findChildVNode2(vNode, startEdge, flags);
  }
  return null;
}
function callAllAnimationHooks2(animationQueue, callback) {
  var animationsLeft = animationQueue.length;
  var fn;
  while ((fn = animationQueue.pop()) !== undefined) {
    fn(function() {
      if (--animationsLeft <= 0 && isFunction2(callback)) {
        callback();
      }
    });
  }
}
function callAllMoveAnimationHooks2(animationQueue) {
  for (var i = 0;i < animationQueue.length; i++) {
    animationQueue[i].fn();
  }
  for (var _i = 0;_i < animationQueue.length; _i++) {
    var tmp = animationQueue[_i];
    insertOrAppend2(tmp.parent, tmp.dom, tmp.next);
  }
  animationQueue.splice(0, animationQueue.length);
}
function clearVNodeDOM2(vNode, parentDOM, deferredRemoval) {
  do {
    var flags = vNode.flags;
    if (flags & 1521) {
      if (!deferredRemoval || vNode.dom.parentNode === parentDOM) {
        removeChild2(parentDOM, vNode.dom);
      }
      return;
    }
    var children = vNode.children;
    if (flags & 4) {
      vNode = children.$LI;
    }
    if (flags & 8) {
      vNode = children;
    }
    if (flags & 8192) {
      if (vNode.childFlags === 2) {
        vNode = children;
      } else {
        for (var i = 0, len = children.length;i < len; ++i) {
          clearVNodeDOM2(children[i], parentDOM, false);
        }
        return;
      }
    }
  } while (vNode);
}
function createDeferComponentClassRemovalCallback2(vNode, parentDOM) {
  return function() {
    clearVNodeDOM2(vNode, parentDOM, true);
  };
}
function removeVNodeDOM2(vNode, parentDOM, animations) {
  if (animations.componentWillDisappear.length > 0) {
    callAllAnimationHooks2(animations.componentWillDisappear, createDeferComponentClassRemovalCallback2(vNode, parentDOM));
  } else {
    clearVNodeDOM2(vNode, parentDOM, false);
  }
}
function addMoveAnimationHook2(animations, parentVNode, refOrInstance, dom, parentDOM, nextNode, flags, props) {
  animations.componentWillMove.push({
    dom,
    fn: function fn() {
      if (flags & 4) {
        refOrInstance.componentWillMove(parentVNode, parentDOM, dom);
      } else if (flags & 8) {
        refOrInstance.onComponentWillMove(parentVNode, parentDOM, dom, props);
      }
    },
    next: nextNode,
    parent: parentDOM
  });
}
function moveVNodeDOM2(parentVNode, vNode, parentDOM, nextNode, animations) {
  var refOrInstance;
  var instanceProps;
  var instanceFlags = vNode.flags;
  do {
    var flags = vNode.flags;
    if (flags & 1521) {
      if (!isNullOrUndef3(refOrInstance) && (isFunction2(refOrInstance.componentWillMove) || isFunction2(refOrInstance.onComponentWillMove))) {
        addMoveAnimationHook2(animations, parentVNode, refOrInstance, vNode.dom, parentDOM, nextNode, instanceFlags, instanceProps);
      } else {
        insertOrAppend2(parentDOM, vNode.dom, nextNode);
      }
      return;
    }
    var children = vNode.children;
    if (flags & 4) {
      refOrInstance = vNode.children;
      instanceProps = vNode.props;
      vNode = children.$LI;
    } else if (flags & 8) {
      refOrInstance = vNode.ref;
      instanceProps = vNode.props;
      vNode = children;
    } else if (flags & 8192) {
      if (vNode.childFlags === 2) {
        vNode = children;
      } else {
        for (var i = 0, len = children.length;i < len; ++i) {
          moveVNodeDOM2(parentVNode, children[i], parentDOM, nextNode, animations);
        }
        return;
      }
    }
  } while (vNode);
}
function createDerivedState2(instance, nextProps, state) {
  if (instance.constructor.getDerivedStateFromProps) {
    return combineFrom2(state, instance.constructor.getDerivedStateFromProps(nextProps, state));
  }
  return state;
}
var renderCheck2 = {
  v: false
};
var options2 = {
  componentComparator: null,
  createVNode: null,
  renderComplete: null
};
function setTextContent2(dom, children) {
  dom.textContent = children;
}
function isLastValueSameLinkEvent2(lastValue, nextValue) {
  return isLinkEventObject2(lastValue) && lastValue.event === nextValue.event && lastValue.data === nextValue.data;
}
function mergeUnsetProperties2(to, from) {
  for (var propName in from) {
    if (isUndefined3(to[propName])) {
      to[propName] = from[propName];
    }
  }
  return to;
}
function safeCall12(method, arg1) {
  return !!isFunction2(method) && (method(arg1), true);
}
var keyPrefix2 = "$";
function V2(childFlags, children, className, flags, key, props, ref, type) {
  this.childFlags = childFlags;
  this.children = children;
  this.className = className;
  this.dom = null;
  this.flags = flags;
  this.key = key === undefined ? null : key;
  this.props = props === undefined ? null : props;
  this.ref = ref === undefined ? null : ref;
  this.type = type;
}
function createVNode2(flags, type, className, children, childFlags, props, key, ref) {
  var childFlag = childFlags === undefined ? 1 : childFlags;
  var vNode = new V2(childFlag, children, className, flags, key, props, ref, type);
  if (options2.createVNode) {
    options2.createVNode(vNode);
  }
  if (childFlag === 0) {
    normalizeChildren2(vNode, vNode.children);
  }
  return vNode;
}
function mergeDefaultHooks2(flags, type, ref) {
  if (flags & 4) {
    return ref;
  }
  var defaultHooks = (flags & 32768 ? type.render : type).defaultHooks;
  if (isNullOrUndef3(defaultHooks)) {
    return ref;
  }
  if (isNullOrUndef3(ref)) {
    return defaultHooks;
  }
  return mergeUnsetProperties2(ref, defaultHooks);
}
function mergeDefaultProps2(flags, type, props) {
  var defaultProps = (flags & 32768 ? type.render : type).defaultProps;
  if (isNullOrUndef3(defaultProps)) {
    return props;
  }
  if (isNullOrUndef3(props)) {
    return combineFrom2(defaultProps, null);
  }
  return mergeUnsetProperties2(props, defaultProps);
}
function resolveComponentFlags2(flags, type) {
  if (flags & 12) {
    return flags;
  }
  if (type.prototype && type.prototype.render) {
    return 4;
  }
  if (type.render) {
    return 32776;
  }
  return 8;
}
function createComponentVNode2(flags, type, props, key, ref) {
  flags = resolveComponentFlags2(flags, type);
  var vNode = new V2(1, null, null, flags, key, mergeDefaultProps2(flags, type, props), mergeDefaultHooks2(flags, type, ref), type);
  if (options2.createVNode) {
    options2.createVNode(vNode);
  }
  return vNode;
}
function createTextVNode2(text, key) {
  return new V2(1, isNullOrUndef3(text) || text === true || text === false ? "" : text, null, 16, key, null, null, null);
}
function createFragment2(children, childFlags, key) {
  var fragment = createVNode2(8192, 8192, null, children, childFlags, null, key, null);
  switch (fragment.childFlags) {
    case 1:
      fragment.children = createVoidVNode2();
      fragment.childFlags = 2;
      break;
    case 16:
      fragment.children = [createTextVNode2(children)];
      fragment.childFlags = 4;
      break;
  }
  return fragment;
}
function cloneFragment2(vNodeToClone) {
  var oldChildren = vNodeToClone.children;
  var childFlags = vNodeToClone.childFlags;
  return createFragment2(childFlags === 2 ? directClone2(oldChildren) : oldChildren.map(directClone2), childFlags, vNodeToClone.key);
}
function directClone2(vNodeToClone) {
  var flags = vNodeToClone.flags & -16385;
  var props = vNodeToClone.props;
  if (flags & 14) {
    if (!isNull2(props)) {
      var propsToClone = props;
      props = {};
      for (var key in propsToClone) {
        props[key] = propsToClone[key];
      }
    }
  }
  if ((flags & 8192) === 0) {
    return new V2(vNodeToClone.childFlags, vNodeToClone.children, vNodeToClone.className, flags, vNodeToClone.key, props, vNodeToClone.ref, vNodeToClone.type);
  }
  return cloneFragment2(vNodeToClone);
}
function createVoidVNode2() {
  return createTextVNode2("", null);
}
function _normalizeVNodes2(nodes, result2, index, currentKey) {
  for (var len = nodes.length;index < len; index++) {
    var n = nodes[index];
    if (!isInvalid2(n)) {
      var newKey = currentKey + keyPrefix2 + index;
      if (isArray2(n)) {
        _normalizeVNodes2(n, result2, 0, newKey);
      } else {
        if (isStringOrNumber2(n)) {
          n = createTextVNode2(n, newKey);
        } else {
          var oldKey = n.key;
          var isPrefixedKey = isString3(oldKey) && oldKey[0] === keyPrefix2;
          if (n.flags & 81920 || isPrefixedKey) {
            n = directClone2(n);
          }
          n.flags |= 65536;
          if (!isPrefixedKey) {
            if (isNull2(oldKey)) {
              n.key = newKey;
            } else {
              n.key = currentKey + oldKey;
            }
          } else if (oldKey.substring(0, currentKey.length) !== currentKey) {
            n.key = currentKey + oldKey;
          }
        }
        result2.push(n);
      }
    }
  }
}
function getFlagsForElementVnode2(type) {
  switch (type) {
    case "svg":
      return 32;
    case "input":
      return 64;
    case "select":
      return 256;
    case "textarea":
      return 128;
    case Fragment2:
      return 8192;
    default:
      return 1;
  }
}
function normalizeChildren2(vNode, children) {
  var newChildren;
  var newChildFlags = 1;
  if (isInvalid2(children)) {
    newChildren = children;
  } else if (isStringOrNumber2(children)) {
    newChildFlags = 16;
    newChildren = children;
  } else if (isArray2(children)) {
    var len = children.length;
    for (var i = 0;i < len; ++i) {
      var n = children[i];
      if (isInvalid2(n) || isArray2(n)) {
        newChildren = newChildren || children.slice(0, i);
        _normalizeVNodes2(children, newChildren, i, "");
        break;
      } else if (isStringOrNumber2(n)) {
        newChildren = newChildren || children.slice(0, i);
        newChildren.push(createTextVNode2(n, keyPrefix2 + i));
      } else {
        var key = n.key;
        var needsCloning = (n.flags & 81920) > 0;
        var isNullKey = isNull2(key);
        var isPrefixed = isString3(key) && key[0] === keyPrefix2;
        if (needsCloning || isNullKey || isPrefixed) {
          newChildren = newChildren || children.slice(0, i);
          if (needsCloning || isPrefixed) {
            n = directClone2(n);
          }
          if (isNullKey || isPrefixed) {
            n.key = keyPrefix2 + i;
          }
          newChildren.push(n);
        } else if (newChildren) {
          newChildren.push(n);
        }
        n.flags |= 65536;
      }
    }
    newChildren = newChildren || children;
    if (newChildren.length === 0) {
      newChildFlags = 1;
    } else {
      newChildFlags = 8;
    }
  } else {
    newChildren = children;
    newChildren.flags |= 65536;
    if (children.flags & 81920) {
      newChildren = directClone2(children);
    }
    newChildFlags = 2;
  }
  vNode.children = newChildren;
  vNode.childFlags = newChildFlags;
  return vNode;
}
function normalizeRoot2(input) {
  if (isInvalid2(input) || isStringOrNumber2(input)) {
    return createTextVNode2(input, null);
  }
  if (isArray2(input)) {
    return createFragment2(input, 0, null);
  }
  return input.flags & 16384 ? directClone2(input) : input;
}
var xlinkNS2 = "http://www.w3.org/1999/xlink";
var xmlNS2 = "http://www.w3.org/XML/1998/namespace";
var namespaces2 = {
  "xlink:actuate": xlinkNS2,
  "xlink:arcrole": xlinkNS2,
  "xlink:href": xlinkNS2,
  "xlink:role": xlinkNS2,
  "xlink:show": xlinkNS2,
  "xlink:title": xlinkNS2,
  "xlink:type": xlinkNS2,
  "xml:base": xmlNS2,
  "xml:lang": xmlNS2,
  "xml:space": xmlNS2
};
function getDelegatedEventObject2(v) {
  return {
    onClick: v,
    onDblClick: v,
    onFocusIn: v,
    onFocusOut: v,
    onKeyDown: v,
    onKeyPress: v,
    onKeyUp: v,
    onMouseDown: v,
    onMouseMove: v,
    onMouseUp: v,
    onTouchEnd: v,
    onTouchMove: v,
    onTouchStart: v
  };
}
var attachedEventCounts2 = getDelegatedEventObject2(0);
var attachedEvents2 = getDelegatedEventObject2(null);
var syntheticEvents2 = getDelegatedEventObject2(true);
function updateOrAddSyntheticEvent2(name, dom) {
  var eventsObject = dom.$EV;
  if (!eventsObject) {
    eventsObject = dom.$EV = getDelegatedEventObject2(null);
  }
  if (!eventsObject[name]) {
    if (++attachedEventCounts2[name] === 1) {
      attachedEvents2[name] = attachEventToDocument2(name);
    }
  }
  return eventsObject;
}
function unmountSyntheticEvent2(name, dom) {
  var eventsObject = dom.$EV;
  if (eventsObject && eventsObject[name]) {
    if (--attachedEventCounts2[name] === 0) {
      document.removeEventListener(normalizeEventName2(name), attachedEvents2[name]);
      attachedEvents2[name] = null;
    }
    eventsObject[name] = null;
  }
}
function handleSyntheticEvent2(name, lastEvent, nextEvent, dom) {
  if (isFunction2(nextEvent)) {
    updateOrAddSyntheticEvent2(name, dom)[name] = nextEvent;
  } else if (isLinkEventObject2(nextEvent)) {
    if (isLastValueSameLinkEvent2(lastEvent, nextEvent)) {
      return;
    }
    updateOrAddSyntheticEvent2(name, dom)[name] = nextEvent;
  } else {
    unmountSyntheticEvent2(name, dom);
  }
}
function getTargetNode2(event2) {
  return isFunction2(event2.composedPath) ? event2.composedPath()[0] : event2.target;
}
function dispatchEvents2(event2, isClick, name, eventData) {
  var dom = getTargetNode2(event2);
  do {
    if (isClick && dom.disabled) {
      return;
    }
    var eventsObject = dom.$EV;
    if (eventsObject) {
      var currentEvent = eventsObject[name];
      if (currentEvent) {
        eventData.dom = dom;
        currentEvent.event ? currentEvent.event(currentEvent.data, event2) : currentEvent(event2);
        if (event2.cancelBubble) {
          return;
        }
      }
    }
    dom = dom.parentNode;
  } while (!isNull2(dom));
}
function stopPropagation2() {
  this.cancelBubble = true;
  if (!this.immediatePropagationStopped) {
    this.stopImmediatePropagation();
  }
}
function isDefaultPrevented2() {
  return this.defaultPrevented;
}
function isPropagationStopped2() {
  return this.cancelBubble;
}
function extendEventProperties2(event2) {
  var eventData = {
    dom: document
  };
  event2.isDefaultPrevented = isDefaultPrevented2;
  event2.isPropagationStopped = isPropagationStopped2;
  event2.stopPropagation = stopPropagation2;
  Object.defineProperty(event2, "currentTarget", {
    configurable: true,
    get: function get() {
      return eventData.dom;
    }
  });
  return eventData;
}
function rootClickEvent2(name) {
  return function(event2) {
    if (event2.button !== 0) {
      event2.stopPropagation();
      return;
    }
    dispatchEvents2(event2, true, name, extendEventProperties2(event2));
  };
}
function rootEvent2(name) {
  return function(event2) {
    dispatchEvents2(event2, false, name, extendEventProperties2(event2));
  };
}
function attachEventToDocument2(name) {
  var attachedEvent = name === "onClick" || name === "onDblClick" ? rootClickEvent2(name) : rootEvent2(name);
  document.addEventListener(normalizeEventName2(name), attachedEvent);
  return attachedEvent;
}
function isSameInnerHTML2(dom, innerHTML) {
  var tempdom = document.createElement("i");
  tempdom.innerHTML = innerHTML;
  return tempdom.innerHTML === dom.innerHTML;
}
function triggerEventListener2(props, methodName, e) {
  if (props[methodName]) {
    var listener = props[methodName];
    if (listener.event) {
      listener.event(listener.data, e);
    } else {
      listener(e);
    }
  } else {
    var nativeListenerName = methodName.toLowerCase();
    if (props[nativeListenerName]) {
      props[nativeListenerName](e);
    }
  }
}
function createWrappedFunction2(methodName, applyValue) {
  var fnMethod = function fnMethod(e) {
    var vNode = this.$V;
    if (!vNode) {
      return;
    }
    var props = vNode.props || EMPTY_OBJ2;
    var dom = vNode.dom;
    if (isString3(methodName)) {
      triggerEventListener2(props, methodName, e);
    } else {
      for (var i = 0;i < methodName.length; ++i) {
        triggerEventListener2(props, methodName[i], e);
      }
    }
    if (isFunction2(applyValue)) {
      var newVNode = this.$V;
      var newProps = newVNode.props || EMPTY_OBJ2;
      applyValue(newProps, dom, false, newVNode);
    }
  };
  Object.defineProperty(fnMethod, "wrapped", {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });
  return fnMethod;
}
function attachEvent2(dom, eventName, handler) {
  var previousKey = "$" + eventName;
  var previousArgs = dom[previousKey];
  if (previousArgs) {
    if (previousArgs[1].wrapped) {
      return;
    }
    dom.removeEventListener(previousArgs[0], previousArgs[1]);
    dom[previousKey] = null;
  }
  if (isFunction2(handler)) {
    dom.addEventListener(eventName, handler);
    dom[previousKey] = [eventName, handler];
  }
}
function isCheckedType2(type) {
  return type === "checkbox" || type === "radio";
}
var onTextInputChange2 = createWrappedFunction2("onInput", applyValueInput2);
var wrappedOnChange$12 = createWrappedFunction2(["onClick", "onChange"], applyValueInput2);
function emptywrapper2(event2) {
  event2.stopPropagation();
}
emptywrapper2.wrapped = true;
function inputEvents2(dom, nextPropsOrEmpty) {
  if (isCheckedType2(nextPropsOrEmpty.type)) {
    attachEvent2(dom, "change", wrappedOnChange$12);
    attachEvent2(dom, "click", emptywrapper2);
  } else {
    attachEvent2(dom, "input", onTextInputChange2);
  }
}
function applyValueInput2(nextPropsOrEmpty, dom) {
  var type = nextPropsOrEmpty.type;
  var value = nextPropsOrEmpty.value;
  var checked = nextPropsOrEmpty.checked;
  var multiple = nextPropsOrEmpty.multiple;
  var defaultValue = nextPropsOrEmpty.defaultValue;
  var hasValue = !isNullOrUndef3(value);
  if (type && type !== dom.type) {
    dom.setAttribute("type", type);
  }
  if (!isNullOrUndef3(multiple) && multiple !== dom.multiple) {
    dom.multiple = multiple;
  }
  if (!isNullOrUndef3(defaultValue) && !hasValue) {
    dom.defaultValue = defaultValue + "";
  }
  if (isCheckedType2(type)) {
    if (hasValue) {
      dom.value = value;
    }
    if (!isNullOrUndef3(checked)) {
      dom.checked = checked;
    }
  } else {
    if (hasValue && dom.value !== value) {
      dom.defaultValue = value;
      dom.value = value;
    } else if (!isNullOrUndef3(checked)) {
      dom.checked = checked;
    }
  }
}
function updateChildOptions2(vNode, value) {
  if (vNode.type === "option") {
    updateChildOption2(vNode, value);
  } else {
    var children = vNode.children;
    var flags = vNode.flags;
    if (flags & 4) {
      updateChildOptions2(children.$LI, value);
    } else if (flags & 8) {
      updateChildOptions2(children, value);
    } else if (vNode.childFlags === 2) {
      updateChildOptions2(children, value);
    } else if (vNode.childFlags & 12) {
      for (var i = 0, len = children.length;i < len; ++i) {
        updateChildOptions2(children[i], value);
      }
    }
  }
}
function updateChildOption2(vNode, value) {
  var props = vNode.props || EMPTY_OBJ2;
  var dom = vNode.dom;
  dom.value = props.value;
  if (props.value === value || isArray2(value) && value.indexOf(props.value) !== -1) {
    dom.selected = true;
  } else if (!isNullOrUndef3(value) || !isNullOrUndef3(props.selected)) {
    dom.selected = props.selected || false;
  }
}
var onSelectChange2 = createWrappedFunction2("onChange", applyValueSelect2);
function selectEvents2(dom) {
  attachEvent2(dom, "change", onSelectChange2);
}
function applyValueSelect2(nextPropsOrEmpty, dom, mounting, vNode) {
  var multiplePropInBoolean = Boolean(nextPropsOrEmpty.multiple);
  if (!isNullOrUndef3(nextPropsOrEmpty.multiple) && multiplePropInBoolean !== dom.multiple) {
    dom.multiple = multiplePropInBoolean;
  }
  var index = nextPropsOrEmpty.selectedIndex;
  if (index === -1) {
    dom.selectedIndex = -1;
  }
  var childFlags = vNode.childFlags;
  if (childFlags !== 1) {
    var value = nextPropsOrEmpty.value;
    if (isNumber3(index) && index > -1 && dom.options[index]) {
      value = dom.options[index].value;
    }
    if (mounting && isNullOrUndef3(value)) {
      value = nextPropsOrEmpty.defaultValue;
    }
    updateChildOptions2(vNode, value);
  }
}
var onTextareaInputChange2 = createWrappedFunction2("onInput", applyValueTextArea2);
var wrappedOnChange2 = createWrappedFunction2("onChange");
function textAreaEvents2(dom, nextPropsOrEmpty) {
  attachEvent2(dom, "input", onTextareaInputChange2);
  if (nextPropsOrEmpty.onChange) {
    attachEvent2(dom, "change", wrappedOnChange2);
  }
}
function applyValueTextArea2(nextPropsOrEmpty, dom, mounting) {
  var value = nextPropsOrEmpty.value;
  var domValue = dom.value;
  if (isNullOrUndef3(value)) {
    if (mounting) {
      var defaultValue = nextPropsOrEmpty.defaultValue;
      if (!isNullOrUndef3(defaultValue) && defaultValue !== domValue) {
        dom.defaultValue = defaultValue;
        dom.value = defaultValue;
      }
    }
  } else if (domValue !== value) {
    dom.defaultValue = value;
    dom.value = value;
  }
}
function processElement2(flags, vNode, dom, nextPropsOrEmpty, mounting, isControlled) {
  if (flags & 64) {
    applyValueInput2(nextPropsOrEmpty, dom);
  } else if (flags & 256) {
    applyValueSelect2(nextPropsOrEmpty, dom, mounting, vNode);
  } else if (flags & 128) {
    applyValueTextArea2(nextPropsOrEmpty, dom, mounting);
  }
  if (isControlled) {
    dom.$V = vNode;
  }
}
function addFormElementEventHandlers2(flags, dom, nextPropsOrEmpty) {
  if (flags & 64) {
    inputEvents2(dom, nextPropsOrEmpty);
  } else if (flags & 256) {
    selectEvents2(dom);
  } else if (flags & 128) {
    textAreaEvents2(dom, nextPropsOrEmpty);
  }
}
function isControlledFormElement2(nextPropsOrEmpty) {
  return nextPropsOrEmpty.type && isCheckedType2(nextPropsOrEmpty.type) ? !isNullOrUndef3(nextPropsOrEmpty.checked) : !isNullOrUndef3(nextPropsOrEmpty.value);
}
function unmountRef2(ref) {
  if (ref) {
    if (!safeCall12(ref, null) && ref.current) {
      ref.current = null;
    }
  }
}
function mountRef2(ref, value, lifecycle) {
  if (ref && (isFunction2(ref) || ref.current !== undefined)) {
    lifecycle.push(function() {
      if (!safeCall12(ref, value) && ref.current !== undefined) {
        ref.current = value;
      }
    });
  }
}
function remove2(vNode, parentDOM, animations) {
  unmount2(vNode, animations);
  removeVNodeDOM2(vNode, parentDOM, animations);
}
function unmount2(vNode, animations) {
  var flags = vNode.flags;
  var children = vNode.children;
  var ref;
  if (flags & 481) {
    ref = vNode.ref;
    var props = vNode.props;
    unmountRef2(ref);
    var childFlags = vNode.childFlags;
    if (!isNull2(props)) {
      var keys2 = Object.keys(props);
      for (var i = 0, len = keys2.length;i < len; i++) {
        var key = keys2[i];
        if (syntheticEvents2[key]) {
          unmountSyntheticEvent2(key, vNode.dom);
        }
      }
    }
    if (childFlags & 12) {
      unmountAllChildren2(children, animations);
    } else if (childFlags === 2) {
      unmount2(children, animations);
    }
  } else if (children) {
    if (flags & 4) {
      if (isFunction2(children.componentWillUnmount)) {
        children.componentWillUnmount();
      }
      var childAnimations = animations;
      if (isFunction2(children.componentWillDisappear)) {
        childAnimations = new AnimationQueues3;
        addDisappearAnimationHook2(animations, children, children.$LI.dom, flags, undefined);
      }
      unmountRef2(vNode.ref);
      children.$UN = true;
      unmount2(children.$LI, childAnimations);
    } else if (flags & 8) {
      var _childAnimations = animations;
      ref = vNode.ref;
      if (!isNullOrUndef3(ref)) {
        var domEl = null;
        if (isFunction2(ref.onComponentWillUnmount)) {
          domEl = findDOMFromVNode2(vNode, true);
          ref.onComponentWillUnmount(domEl, vNode.props || EMPTY_OBJ2);
        }
        if (isFunction2(ref.onComponentWillDisappear)) {
          _childAnimations = new AnimationQueues3;
          domEl = domEl || findDOMFromVNode2(vNode, true);
          addDisappearAnimationHook2(animations, ref, domEl, flags, vNode.props);
        }
      }
      unmount2(children, _childAnimations);
    } else if (flags & 1024) {
      remove2(children, vNode.ref, animations);
    } else if (flags & 8192) {
      if (vNode.childFlags & 12) {
        unmountAllChildren2(children, animations);
      }
    }
  }
}
function unmountAllChildren2(children, animations) {
  for (var i = 0, len = children.length;i < len; ++i) {
    unmount2(children[i], animations);
  }
}
function createClearAllCallback2(children, parentDOM) {
  return function() {
    if (parentDOM) {
      for (var i = 0;i < children.length; i++) {
        var vNode = children[i];
        clearVNodeDOM2(vNode, parentDOM, false);
      }
    }
  };
}
function clearDOM2(parentDOM, children, animations) {
  if (animations.componentWillDisappear.length > 0) {
    callAllAnimationHooks2(animations.componentWillDisappear, createClearAllCallback2(children, parentDOM));
  } else {
    parentDOM.textContent = "";
  }
}
function removeAllChildren2(dom, vNode, children, animations) {
  unmountAllChildren2(children, animations);
  if (vNode.flags & 8192) {
    removeVNodeDOM2(vNode, dom, animations);
  } else {
    clearDOM2(dom, children, animations);
  }
}
function addDisappearAnimationHook2(animations, instanceOrRef, dom, flags, props) {
  animations.componentWillDisappear.push(function(callback) {
    if (flags & 4) {
      instanceOrRef.componentWillDisappear(dom, callback);
    } else if (flags & 8) {
      instanceOrRef.onComponentWillDisappear(dom, props, callback);
    }
  });
}
function wrapLinkEvent2(nextValue) {
  var ev = nextValue.event;
  return function(e) {
    ev(nextValue.data, e);
  };
}
function patchEvent2(name, lastValue, nextValue, dom) {
  if (isLinkEventObject2(nextValue)) {
    if (isLastValueSameLinkEvent2(lastValue, nextValue)) {
      return;
    }
    nextValue = wrapLinkEvent2(nextValue);
  }
  attachEvent2(dom, normalizeEventName2(name), nextValue);
}
function patchStyle2(lastAttrValue, nextAttrValue, dom) {
  if (isNullOrUndef3(nextAttrValue)) {
    dom.removeAttribute("style");
    return;
  }
  var domStyle = dom.style;
  var style;
  var value;
  if (isString3(nextAttrValue)) {
    domStyle.cssText = nextAttrValue;
    return;
  }
  if (!isNullOrUndef3(lastAttrValue) && !isString3(lastAttrValue)) {
    for (style in nextAttrValue) {
      value = nextAttrValue[style];
      if (value !== lastAttrValue[style]) {
        domStyle.setProperty(style, value);
      }
    }
    for (style in lastAttrValue) {
      if (isNullOrUndef3(nextAttrValue[style])) {
        domStyle.removeProperty(style);
      }
    }
  } else {
    for (style in nextAttrValue) {
      value = nextAttrValue[style];
      domStyle.setProperty(style, value);
    }
  }
}
function patchDangerInnerHTML2(lastValue, nextValue, lastVNode, dom, animations) {
  var lastHtml = lastValue && lastValue.__html || "";
  var nextHtml = nextValue && nextValue.__html || "";
  if (lastHtml !== nextHtml) {
    if (!isNullOrUndef3(nextHtml) && !isSameInnerHTML2(dom, nextHtml)) {
      if (!isNull2(lastVNode)) {
        if (lastVNode.childFlags & 12) {
          unmountAllChildren2(lastVNode.children, animations);
        } else if (lastVNode.childFlags === 2) {
          unmount2(lastVNode.children, animations);
        }
        lastVNode.children = null;
        lastVNode.childFlags = 1;
      }
      dom.innerHTML = nextHtml;
    }
  }
}
function patchProp2(prop, lastValue, nextValue, dom, isSVG, hasControlledValue, lastVNode, animations) {
  switch (prop) {
    case "children":
    case "childrenType":
    case "className":
    case "defaultValue":
    case "key":
    case "multiple":
    case "ref":
    case "selectedIndex":
      break;
    case "autoFocus":
      dom.autofocus = !!nextValue;
      break;
    case "allowfullscreen":
    case "autoplay":
    case "capture":
    case "checked":
    case "controls":
    case "default":
    case "disabled":
    case "hidden":
    case "indeterminate":
    case "loop":
    case "muted":
    case "novalidate":
    case "open":
    case "readOnly":
    case "required":
    case "reversed":
    case "scoped":
    case "seamless":
    case "selected":
      dom[prop] = !!nextValue;
      break;
    case "defaultChecked":
    case "value":
    case "volume":
      if (hasControlledValue && prop === "value") {
        break;
      }
      var value = isNullOrUndef3(nextValue) ? "" : nextValue;
      if (dom[prop] !== value) {
        dom[prop] = value;
      }
      break;
    case "style":
      patchStyle2(lastValue, nextValue, dom);
      break;
    case "dangerouslySetInnerHTML":
      patchDangerInnerHTML2(lastValue, nextValue, lastVNode, dom, animations);
      break;
    default:
      if (syntheticEvents2[prop]) {
        handleSyntheticEvent2(prop, lastValue, nextValue, dom);
      } else if (prop.charCodeAt(0) === 111 && prop.charCodeAt(1) === 110) {
        patchEvent2(prop, lastValue, nextValue, dom);
      } else if (isNullOrUndef3(nextValue)) {
        dom.removeAttribute(prop);
      } else if (isSVG && namespaces2[prop]) {
        dom.setAttributeNS(namespaces2[prop], prop, nextValue);
      } else {
        dom.setAttribute(prop, nextValue);
      }
      break;
  }
}
function mountProps2(vNode, flags, props, dom, isSVG, animations) {
  var hasControlledValue = false;
  var isFormElement = (flags & 448) > 0;
  if (isFormElement) {
    hasControlledValue = isControlledFormElement2(props);
    if (hasControlledValue) {
      addFormElementEventHandlers2(flags, dom, props);
    }
  }
  for (var prop in props) {
    patchProp2(prop, null, props[prop], dom, isSVG, hasControlledValue, null, animations);
  }
  if (isFormElement) {
    processElement2(flags, vNode, dom, props, true, hasControlledValue);
  }
}
function renderNewInput2(instance, props, context) {
  var nextInput = normalizeRoot2(instance.render(props, instance.state, context));
  var childContext = context;
  if (isFunction2(instance.getChildContext)) {
    childContext = combineFrom2(context, instance.getChildContext());
  }
  instance.$CX = childContext;
  return nextInput;
}
function createClassComponentInstance2(vNode, Component2, props, context, isSVG, lifecycle) {
  var instance = new Component2(props, context);
  var usesNewAPI = instance.$N = Boolean(Component2.getDerivedStateFromProps || instance.getSnapshotBeforeUpdate);
  instance.$SVG = isSVG;
  instance.$L = lifecycle;
  vNode.children = instance;
  instance.$BS = false;
  instance.context = context;
  if (instance.props === EMPTY_OBJ2) {
    instance.props = props;
  }
  if (!usesNewAPI) {
    if (isFunction2(instance.componentWillMount)) {
      instance.$BR = true;
      instance.componentWillMount();
      var pending = instance.$PS;
      if (!isNull2(pending)) {
        var state = instance.state;
        if (isNull2(state)) {
          instance.state = pending;
        } else {
          for (var key in pending) {
            state[key] = pending[key];
          }
        }
        instance.$PS = null;
      }
      instance.$BR = false;
    }
  } else {
    instance.state = createDerivedState2(instance, props, instance.state);
  }
  instance.$LI = renderNewInput2(instance, props, context);
  return instance;
}
function renderFunctionalComponent2(vNode, context) {
  var props = vNode.props || EMPTY_OBJ2;
  return vNode.flags & 32768 ? vNode.type.render(props, vNode.ref, context) : vNode.type(props, context);
}
function mount2(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var flags = vNode.flags |= 16384;
  if (flags & 481) {
    mountElement2(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (flags & 4) {
    mountClassComponent2(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (flags & 8) {
    mountFunctionalComponent2(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (flags & 16) {
    mountText2(vNode, parentDOM, nextNode);
  } else if (flags & 8192) {
    mountFragment2(vNode, context, parentDOM, isSVG, nextNode, lifecycle, animations);
  } else if (flags & 1024) {
    mountPortal2(vNode, context, parentDOM, nextNode, lifecycle, animations);
  } else
    ;
}
function mountPortal2(vNode, context, parentDOM, nextNode, lifecycle, animations) {
  mount2(vNode.children, vNode.ref, context, false, null, lifecycle, animations);
  var placeHolderVNode = createVoidVNode2();
  mountText2(placeHolderVNode, parentDOM, nextNode);
  vNode.dom = placeHolderVNode.dom;
}
function mountFragment2(vNode, context, parentDOM, isSVG, nextNode, lifecycle, animations) {
  var children = vNode.children;
  var childFlags = vNode.childFlags;
  if (childFlags & 12 && children.length === 0) {
    childFlags = vNode.childFlags = 2;
    children = vNode.children = createVoidVNode2();
  }
  if (childFlags === 2) {
    mount2(children, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else {
    mountArrayChildren2(children, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  }
}
function mountText2(vNode, parentDOM, nextNode) {
  var dom = vNode.dom = document.createTextNode(vNode.children);
  if (!isNull2(parentDOM)) {
    insertOrAppend2(parentDOM, dom, nextNode);
  }
}
function mountElement2(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var flags = vNode.flags;
  var props = vNode.props;
  var className = vNode.className;
  var childFlags = vNode.childFlags;
  var dom = vNode.dom = documentCreateElement2(vNode.type, isSVG = isSVG || (flags & 32) > 0);
  var children = vNode.children;
  if (!isNullOrUndef3(className) && className !== "") {
    if (isSVG) {
      dom.setAttribute("class", className);
    } else {
      dom.className = className;
    }
  }
  if (childFlags === 16) {
    setTextContent2(dom, children);
  } else if (childFlags !== 1) {
    var childrenIsSVG = isSVG && vNode.type !== "foreignObject";
    if (childFlags === 2) {
      if (children.flags & 16384) {
        vNode.children = children = directClone2(children);
      }
      mount2(children, dom, context, childrenIsSVG, null, lifecycle, animations);
    } else if (childFlags === 8 || childFlags === 4) {
      mountArrayChildren2(children, dom, context, childrenIsSVG, null, lifecycle, animations);
    }
  }
  if (!isNull2(parentDOM)) {
    insertOrAppend2(parentDOM, dom, nextNode);
  }
  if (!isNull2(props)) {
    mountProps2(vNode, flags, props, dom, isSVG, animations);
  }
  mountRef2(vNode.ref, dom, lifecycle);
}
function mountArrayChildren2(children, dom, context, isSVG, nextNode, lifecycle, animations) {
  for (var i = 0;i < children.length; ++i) {
    var child = children[i];
    if (child.flags & 16384) {
      children[i] = child = directClone2(child);
    }
    mount2(child, dom, context, isSVG, nextNode, lifecycle, animations);
  }
}
function mountClassComponent2(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var instance = createClassComponentInstance2(vNode, vNode.type, vNode.props || EMPTY_OBJ2, context, isSVG, lifecycle);
  var childAnimations = animations;
  if (isFunction2(instance.componentDidAppear)) {
    childAnimations = new AnimationQueues3;
  }
  mount2(instance.$LI, parentDOM, instance.$CX, isSVG, nextNode, lifecycle, childAnimations);
  mountClassComponentCallbacks2(vNode.ref, instance, lifecycle, animations);
}
function mountFunctionalComponent2(vNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var ref = vNode.ref;
  var childAnimations = animations;
  if (!isNullOrUndef3(ref) && isFunction2(ref.onComponentDidAppear)) {
    childAnimations = new AnimationQueues3;
  }
  mount2(vNode.children = normalizeRoot2(renderFunctionalComponent2(vNode, context)), parentDOM, context, isSVG, nextNode, lifecycle, childAnimations);
  mountFunctionalComponentCallbacks2(vNode, lifecycle, animations);
}
function createClassMountCallback2(instance) {
  return function() {
    instance.componentDidMount();
  };
}
function addAppearAnimationHook2(animations, instanceOrRef, dom, flags, props) {
  animations.componentDidAppear.push(function() {
    if (flags & 4) {
      instanceOrRef.componentDidAppear(dom);
    } else if (flags & 8) {
      instanceOrRef.onComponentDidAppear(dom, props);
    }
  });
}
function mountClassComponentCallbacks2(ref, instance, lifecycle, animations) {
  mountRef2(ref, instance, lifecycle);
  if (isFunction2(instance.componentDidMount)) {
    lifecycle.push(createClassMountCallback2(instance));
  }
  if (isFunction2(instance.componentDidAppear)) {
    addAppearAnimationHook2(animations, instance, instance.$LI.dom, 4, undefined);
  }
}
function createOnMountCallback2(ref, vNode) {
  return function() {
    ref.onComponentDidMount(findDOMFromVNode2(vNode, true), vNode.props || EMPTY_OBJ2);
  };
}
function mountFunctionalComponentCallbacks2(vNode, lifecycle, animations) {
  var ref = vNode.ref;
  if (!isNullOrUndef3(ref)) {
    safeCall12(ref.onComponentWillMount, vNode.props || EMPTY_OBJ2);
    if (isFunction2(ref.onComponentDidMount)) {
      lifecycle.push(createOnMountCallback2(ref, vNode));
    }
    if (isFunction2(ref.onComponentDidAppear)) {
      addAppearAnimationHook2(animations, ref, findDOMFromVNode2(vNode, true), 8, vNode.props);
    }
  }
}
function replaceWithNewNode2(lastVNode, nextVNode, parentDOM, context, isSVG, lifecycle, animations) {
  unmount2(lastVNode, animations);
  if ((nextVNode.flags & lastVNode.flags & 1521) !== 0) {
    mount2(nextVNode, null, context, isSVG, null, lifecycle, animations);
    replaceChild2(parentDOM, nextVNode.dom, lastVNode.dom);
  } else {
    mount2(nextVNode, parentDOM, context, isSVG, findDOMFromVNode2(lastVNode, true), lifecycle, animations);
    removeVNodeDOM2(lastVNode, parentDOM, animations);
  }
}
function patch2(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var nextFlags = nextVNode.flags |= 16384;
  if (lastVNode.flags !== nextFlags || lastVNode.type !== nextVNode.type || lastVNode.key !== nextVNode.key || nextFlags & 2048) {
    if (lastVNode.flags & 16384) {
      replaceWithNewNode2(lastVNode, nextVNode, parentDOM, context, isSVG, lifecycle, animations);
    } else {
      mount2(nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
    }
  } else if (nextFlags & 481) {
    patchElement2(lastVNode, nextVNode, context, isSVG, nextFlags, lifecycle, animations);
  } else if (nextFlags & 4) {
    patchClassComponent2(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (nextFlags & 8) {
    patchFunctionalComponent2(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations);
  } else if (nextFlags & 16) {
    patchText2(lastVNode, nextVNode);
  } else if (nextFlags & 8192) {
    patchFragment2(lastVNode, nextVNode, parentDOM, context, isSVG, lifecycle, animations);
  } else {
    patchPortal2(lastVNode, nextVNode, context, lifecycle, animations);
  }
}
function patchSingleTextChild2(lastChildren, nextChildren, parentDOM) {
  if (lastChildren !== nextChildren) {
    if (lastChildren !== "") {
      parentDOM.firstChild.nodeValue = nextChildren;
    } else {
      setTextContent2(parentDOM, nextChildren);
    }
  }
}
function patchContentEditableChildren2(dom, nextChildren) {
  if (dom.textContent !== nextChildren) {
    dom.textContent = nextChildren;
  }
}
function patchFragment2(lastVNode, nextVNode, parentDOM, context, isSVG, lifecycle, animations) {
  var lastChildren = lastVNode.children;
  var nextChildren = nextVNode.children;
  var lastChildFlags = lastVNode.childFlags;
  var nextChildFlags = nextVNode.childFlags;
  var nextNode = null;
  if (nextChildFlags & 12 && nextChildren.length === 0) {
    nextChildFlags = nextVNode.childFlags = 2;
    nextChildren = nextVNode.children = createVoidVNode2();
  }
  var nextIsSingle = (nextChildFlags & 2) !== 0;
  if (lastChildFlags & 12) {
    var lastLen = lastChildren.length;
    if (lastChildFlags & 8 && nextChildFlags & 8 || nextIsSingle || !nextIsSingle && nextChildren.length > lastLen) {
      nextNode = findDOMFromVNode2(lastChildren[lastLen - 1], false).nextSibling;
    }
  }
  patchChildren2(lastChildFlags, nextChildFlags, lastChildren, nextChildren, parentDOM, context, isSVG, nextNode, lastVNode, lifecycle, animations);
}
function patchPortal2(lastVNode, nextVNode, context, lifecycle, animations) {
  var lastContainer = lastVNode.ref;
  var nextContainer = nextVNode.ref;
  var nextChildren = nextVNode.children;
  patchChildren2(lastVNode.childFlags, nextVNode.childFlags, lastVNode.children, nextChildren, lastContainer, context, false, null, lastVNode, lifecycle, animations);
  nextVNode.dom = lastVNode.dom;
  if (lastContainer !== nextContainer && !isInvalid2(nextChildren)) {
    var node = nextChildren.dom;
    removeChild2(lastContainer, node);
    appendChild2(nextContainer, node);
  }
}
function patchElement2(lastVNode, nextVNode, context, isSVG, nextFlags, lifecycle, animations) {
  var dom = nextVNode.dom = lastVNode.dom;
  var lastProps = lastVNode.props;
  var nextProps = nextVNode.props;
  var isFormElement = false;
  var hasControlledValue = false;
  var nextPropsOrEmpty;
  isSVG = isSVG || (nextFlags & 32) > 0;
  if (lastProps !== nextProps) {
    var lastPropsOrEmpty = lastProps || EMPTY_OBJ2;
    nextPropsOrEmpty = nextProps || EMPTY_OBJ2;
    if (nextPropsOrEmpty !== EMPTY_OBJ2) {
      isFormElement = (nextFlags & 448) > 0;
      if (isFormElement) {
        hasControlledValue = isControlledFormElement2(nextPropsOrEmpty);
      }
      for (var prop in nextPropsOrEmpty) {
        var lastValue = lastPropsOrEmpty[prop];
        var nextValue = nextPropsOrEmpty[prop];
        if (lastValue !== nextValue) {
          patchProp2(prop, lastValue, nextValue, dom, isSVG, hasControlledValue, lastVNode, animations);
        }
      }
    }
    if (lastPropsOrEmpty !== EMPTY_OBJ2) {
      for (var _prop in lastPropsOrEmpty) {
        if (isNullOrUndef3(nextPropsOrEmpty[_prop]) && !isNullOrUndef3(lastPropsOrEmpty[_prop])) {
          patchProp2(_prop, lastPropsOrEmpty[_prop], null, dom, isSVG, hasControlledValue, lastVNode, animations);
        }
      }
    }
  }
  var nextChildren = nextVNode.children;
  var nextClassName = nextVNode.className;
  if (lastVNode.className !== nextClassName) {
    if (isNullOrUndef3(nextClassName)) {
      dom.removeAttribute("class");
    } else if (isSVG) {
      dom.setAttribute("class", nextClassName);
    } else {
      dom.className = nextClassName;
    }
  }
  if (nextFlags & 4096) {
    patchContentEditableChildren2(dom, nextChildren);
  } else {
    patchChildren2(lastVNode.childFlags, nextVNode.childFlags, lastVNode.children, nextChildren, dom, context, isSVG && nextVNode.type !== "foreignObject", null, lastVNode, lifecycle, animations);
  }
  if (isFormElement) {
    processElement2(nextFlags, nextVNode, dom, nextPropsOrEmpty, false, hasControlledValue);
  }
  var nextRef = nextVNode.ref;
  var lastRef = lastVNode.ref;
  if (lastRef !== nextRef) {
    unmountRef2(lastRef);
    mountRef2(nextRef, dom, lifecycle);
  }
}
function replaceOneVNodeWithMultipleVNodes2(lastChildren, nextChildren, parentDOM, context, isSVG, lifecycle, animations) {
  unmount2(lastChildren, animations);
  mountArrayChildren2(nextChildren, parentDOM, context, isSVG, findDOMFromVNode2(lastChildren, true), lifecycle, animations);
  removeVNodeDOM2(lastChildren, parentDOM, animations);
}
function patchChildren2(lastChildFlags, nextChildFlags, lastChildren, nextChildren, parentDOM, context, isSVG, nextNode, parentVNode, lifecycle, animations) {
  switch (lastChildFlags) {
    case 2:
      switch (nextChildFlags) {
        case 2:
          patch2(lastChildren, nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
        case 1:
          remove2(lastChildren, parentDOM, animations);
          break;
        case 16:
          unmount2(lastChildren, animations);
          setTextContent2(parentDOM, nextChildren);
          break;
        default:
          replaceOneVNodeWithMultipleVNodes2(lastChildren, nextChildren, parentDOM, context, isSVG, lifecycle, animations);
          break;
      }
      break;
    case 1:
      switch (nextChildFlags) {
        case 2:
          mount2(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
        case 1:
          break;
        case 16:
          setTextContent2(parentDOM, nextChildren);
          break;
        default:
          mountArrayChildren2(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
      }
      break;
    case 16:
      switch (nextChildFlags) {
        case 16:
          patchSingleTextChild2(lastChildren, nextChildren, parentDOM);
          break;
        case 2:
          clearDOM2(parentDOM, lastChildren, animations);
          mount2(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
        case 1:
          clearDOM2(parentDOM, lastChildren, animations);
          break;
        default:
          clearDOM2(parentDOM, lastChildren, animations);
          mountArrayChildren2(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
      }
      break;
    default:
      switch (nextChildFlags) {
        case 16:
          unmountAllChildren2(lastChildren, animations);
          setTextContent2(parentDOM, nextChildren);
          break;
        case 2:
          removeAllChildren2(parentDOM, parentVNode, lastChildren, animations);
          mount2(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
          break;
        case 1:
          removeAllChildren2(parentDOM, parentVNode, lastChildren, animations);
          break;
        default:
          var lastLength = lastChildren.length | 0;
          var nextLength = nextChildren.length | 0;
          if (lastLength === 0) {
            if (nextLength > 0) {
              mountArrayChildren2(nextChildren, parentDOM, context, isSVG, nextNode, lifecycle, animations);
            }
          } else if (nextLength === 0) {
            removeAllChildren2(parentDOM, parentVNode, lastChildren, animations);
          } else if (nextChildFlags === 8 && lastChildFlags === 8) {
            patchKeyedChildren2(lastChildren, nextChildren, parentDOM, context, isSVG, lastLength, nextLength, nextNode, parentVNode, lifecycle, animations);
          } else {
            patchNonKeyedChildren2(lastChildren, nextChildren, parentDOM, context, isSVG, lastLength, nextLength, nextNode, lifecycle, animations);
          }
          break;
      }
      break;
  }
}
function createDidUpdate2(instance, lastProps, lastState, snapshot, lifecycle) {
  lifecycle.push(function() {
    instance.componentDidUpdate(lastProps, lastState, snapshot);
  });
}
function updateClassComponent2(instance, nextState, nextProps, parentDOM, context, isSVG, force, nextNode, lifecycle, animations) {
  var lastState = instance.state;
  var lastProps = instance.props;
  var usesNewAPI = Boolean(instance.$N);
  var hasSCU = isFunction2(instance.shouldComponentUpdate);
  if (usesNewAPI) {
    nextState = createDerivedState2(instance, nextProps, nextState !== lastState ? combineFrom2(lastState, nextState) : nextState);
  }
  if (force || !hasSCU || hasSCU && instance.shouldComponentUpdate(nextProps, nextState, context)) {
    if (!usesNewAPI && isFunction2(instance.componentWillUpdate)) {
      instance.componentWillUpdate(nextProps, nextState, context);
    }
    instance.props = nextProps;
    instance.state = nextState;
    instance.context = context;
    var snapshot = null;
    var nextInput = renderNewInput2(instance, nextProps, context);
    if (usesNewAPI && isFunction2(instance.getSnapshotBeforeUpdate)) {
      snapshot = instance.getSnapshotBeforeUpdate(lastProps, lastState);
    }
    patch2(instance.$LI, nextInput, parentDOM, instance.$CX, isSVG, nextNode, lifecycle, animations);
    instance.$LI = nextInput;
    if (isFunction2(instance.componentDidUpdate)) {
      createDidUpdate2(instance, lastProps, lastState, snapshot, lifecycle);
    }
  } else {
    instance.props = nextProps;
    instance.state = nextState;
    instance.context = context;
  }
}
function patchClassComponent2(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var instance = nextVNode.children = lastVNode.children;
  if (isNull2(instance)) {
    return;
  }
  instance.$L = lifecycle;
  var nextProps = nextVNode.props || EMPTY_OBJ2;
  var nextRef = nextVNode.ref;
  var lastRef = lastVNode.ref;
  var nextState = instance.state;
  if (!instance.$N) {
    if (isFunction2(instance.componentWillReceiveProps)) {
      instance.$BR = true;
      instance.componentWillReceiveProps(nextProps, context);
      if (instance.$UN) {
        return;
      }
      instance.$BR = false;
    }
    if (!isNull2(instance.$PS)) {
      nextState = combineFrom2(nextState, instance.$PS);
      instance.$PS = null;
    }
  }
  updateClassComponent2(instance, nextState, nextProps, parentDOM, context, isSVG, false, nextNode, lifecycle, animations);
  if (lastRef !== nextRef) {
    unmountRef2(lastRef);
    mountRef2(nextRef, instance, lifecycle);
  }
}
function patchFunctionalComponent2(lastVNode, nextVNode, parentDOM, context, isSVG, nextNode, lifecycle, animations) {
  var shouldUpdate = true;
  var nextProps = nextVNode.props || EMPTY_OBJ2;
  var nextRef = nextVNode.ref;
  var lastProps = lastVNode.props;
  var nextHooksDefined = !isNullOrUndef3(nextRef);
  var lastInput = lastVNode.children;
  if (nextHooksDefined && isFunction2(nextRef.onComponentShouldUpdate)) {
    shouldUpdate = nextRef.onComponentShouldUpdate(lastProps, nextProps);
  }
  if (shouldUpdate !== false) {
    if (nextHooksDefined && isFunction2(nextRef.onComponentWillUpdate)) {
      nextRef.onComponentWillUpdate(lastProps, nextProps);
    }
    var nextInput = normalizeRoot2(renderFunctionalComponent2(nextVNode, context));
    patch2(lastInput, nextInput, parentDOM, context, isSVG, nextNode, lifecycle, animations);
    nextVNode.children = nextInput;
    if (nextHooksDefined && isFunction2(nextRef.onComponentDidUpdate)) {
      nextRef.onComponentDidUpdate(lastProps, nextProps);
    }
  } else {
    nextVNode.children = lastInput;
  }
}
function patchText2(lastVNode, nextVNode) {
  var nextText = nextVNode.children;
  var dom = nextVNode.dom = lastVNode.dom;
  if (nextText !== lastVNode.children) {
    dom.nodeValue = nextText;
  }
}
function patchNonKeyedChildren2(lastChildren, nextChildren, dom, context, isSVG, lastChildrenLength, nextChildrenLength, nextNode, lifecycle, animations) {
  var commonLength = lastChildrenLength > nextChildrenLength ? nextChildrenLength : lastChildrenLength;
  var i = 0;
  var nextChild;
  var lastChild;
  for (;i < commonLength; ++i) {
    nextChild = nextChildren[i];
    lastChild = lastChildren[i];
    if (nextChild.flags & 16384) {
      nextChild = nextChildren[i] = directClone2(nextChild);
    }
    patch2(lastChild, nextChild, dom, context, isSVG, nextNode, lifecycle, animations);
    lastChildren[i] = nextChild;
  }
  if (lastChildrenLength < nextChildrenLength) {
    for (i = commonLength;i < nextChildrenLength; ++i) {
      nextChild = nextChildren[i];
      if (nextChild.flags & 16384) {
        nextChild = nextChildren[i] = directClone2(nextChild);
      }
      mount2(nextChild, dom, context, isSVG, nextNode, lifecycle, animations);
    }
  } else if (lastChildrenLength > nextChildrenLength) {
    for (i = commonLength;i < lastChildrenLength; ++i) {
      remove2(lastChildren[i], dom, animations);
    }
  }
}
function patchKeyedChildren2(a, b, dom, context, isSVG, aLength, bLength, outerEdge, parentVNode, lifecycle, animations) {
  var aEnd = aLength - 1;
  var bEnd = bLength - 1;
  var j = 0;
  var aNode = a[j];
  var bNode = b[j];
  var nextPos;
  var nextNode;
  outer: {
    while (aNode.key === bNode.key) {
      if (bNode.flags & 16384) {
        b[j] = bNode = directClone2(bNode);
      }
      patch2(aNode, bNode, dom, context, isSVG, outerEdge, lifecycle, animations);
      a[j] = bNode;
      ++j;
      if (j > aEnd || j > bEnd) {
        break outer;
      }
      aNode = a[j];
      bNode = b[j];
    }
    aNode = a[aEnd];
    bNode = b[bEnd];
    while (aNode.key === bNode.key) {
      if (bNode.flags & 16384) {
        b[bEnd] = bNode = directClone2(bNode);
      }
      patch2(aNode, bNode, dom, context, isSVG, outerEdge, lifecycle, animations);
      a[aEnd] = bNode;
      aEnd--;
      bEnd--;
      if (j > aEnd || j > bEnd) {
        break outer;
      }
      aNode = a[aEnd];
      bNode = b[bEnd];
    }
  }
  if (j > aEnd) {
    if (j <= bEnd) {
      nextPos = bEnd + 1;
      nextNode = nextPos < bLength ? findDOMFromVNode2(b[nextPos], true) : outerEdge;
      while (j <= bEnd) {
        bNode = b[j];
        if (bNode.flags & 16384) {
          b[j] = bNode = directClone2(bNode);
        }
        ++j;
        mount2(bNode, dom, context, isSVG, nextNode, lifecycle, animations);
      }
    }
  } else if (j > bEnd) {
    while (j <= aEnd) {
      remove2(a[j++], dom, animations);
    }
  } else {
    patchKeyedChildrenComplex2(a, b, context, aLength, bLength, aEnd, bEnd, j, dom, isSVG, outerEdge, parentVNode, lifecycle, animations);
  }
}
function patchKeyedChildrenComplex2(a, b, context, aLength, bLength, aEnd, bEnd, j, dom, isSVG, outerEdge, parentVNode, lifecycle, animations) {
  var aNode;
  var bNode;
  var nextPos = 0;
  var i = 0;
  var aStart = j;
  var bStart = j;
  var aLeft = aEnd - j + 1;
  var bLeft = bEnd - j + 1;
  var sources = new Int32Array(bLeft + 1);
  var canRemoveWholeContent = aLeft === aLength;
  var moved = false;
  var pos = 0;
  var patched = 0;
  if (bLength < 4 || (aLeft | bLeft) < 32) {
    for (i = aStart;i <= aEnd; ++i) {
      aNode = a[i];
      if (patched < bLeft) {
        for (j = bStart;j <= bEnd; j++) {
          bNode = b[j];
          if (aNode.key === bNode.key) {
            sources[j - bStart] = i + 1;
            if (canRemoveWholeContent) {
              canRemoveWholeContent = false;
              while (aStart < i) {
                remove2(a[aStart++], dom, animations);
              }
            }
            if (pos > j) {
              moved = true;
            } else {
              pos = j;
            }
            if (bNode.flags & 16384) {
              b[j] = bNode = directClone2(bNode);
            }
            patch2(aNode, bNode, dom, context, isSVG, outerEdge, lifecycle, animations);
            ++patched;
            break;
          }
        }
        if (!canRemoveWholeContent && j > bEnd) {
          remove2(aNode, dom, animations);
        }
      } else if (!canRemoveWholeContent) {
        remove2(aNode, dom, animations);
      }
    }
  } else {
    var keyIndex = {};
    for (i = bStart;i <= bEnd; ++i) {
      keyIndex[b[i].key] = i;
    }
    for (i = aStart;i <= aEnd; ++i) {
      aNode = a[i];
      if (patched < bLeft) {
        j = keyIndex[aNode.key];
        if (j !== undefined) {
          if (canRemoveWholeContent) {
            canRemoveWholeContent = false;
            while (i > aStart) {
              remove2(a[aStart++], dom, animations);
            }
          }
          sources[j - bStart] = i + 1;
          if (pos > j) {
            moved = true;
          } else {
            pos = j;
          }
          bNode = b[j];
          if (bNode.flags & 16384) {
            b[j] = bNode = directClone2(bNode);
          }
          patch2(aNode, bNode, dom, context, isSVG, outerEdge, lifecycle, animations);
          ++patched;
        } else if (!canRemoveWholeContent) {
          remove2(aNode, dom, animations);
        }
      } else if (!canRemoveWholeContent) {
        remove2(aNode, dom, animations);
      }
    }
  }
  if (canRemoveWholeContent) {
    removeAllChildren2(dom, parentVNode, a, animations);
    mountArrayChildren2(b, dom, context, isSVG, outerEdge, lifecycle, animations);
  } else if (moved) {
    var seq = lis_algorithm2(sources);
    j = seq.length - 1;
    for (i = bLeft - 1;i >= 0; i--) {
      if (sources[i] === 0) {
        pos = i + bStart;
        bNode = b[pos];
        if (bNode.flags & 16384) {
          b[pos] = bNode = directClone2(bNode);
        }
        nextPos = pos + 1;
        mount2(bNode, dom, context, isSVG, nextPos < bLength ? findDOMFromVNode2(b[nextPos], true) : outerEdge, lifecycle, animations);
      } else if (j < 0 || i !== seq[j]) {
        pos = i + bStart;
        bNode = b[pos];
        nextPos = pos + 1;
        moveVNodeDOM2(parentVNode, bNode, dom, nextPos < bLength ? findDOMFromVNode2(b[nextPos], true) : outerEdge, animations);
      } else {
        j--;
      }
    }
    if (animations.componentWillMove.length > 0) {
      callAllMoveAnimationHooks2(animations.componentWillMove);
    }
  } else if (patched !== bLeft) {
    for (i = bLeft - 1;i >= 0; i--) {
      if (sources[i] === 0) {
        pos = i + bStart;
        bNode = b[pos];
        if (bNode.flags & 16384) {
          b[pos] = bNode = directClone2(bNode);
        }
        nextPos = pos + 1;
        mount2(bNode, dom, context, isSVG, nextPos < bLength ? findDOMFromVNode2(b[nextPos], true) : outerEdge, lifecycle, animations);
      }
    }
  }
}
var result2;
var p2;
var maxLen2 = 0;
function lis_algorithm2(arr) {
  var arrI = 0;
  var i = 0;
  var j = 0;
  var k = 0;
  var u = 0;
  var v = 0;
  var c = 0;
  var len = arr.length;
  if (len > maxLen2) {
    maxLen2 = len;
    result2 = new Int32Array(len);
    p2 = new Int32Array(len);
  }
  for (;i < len; ++i) {
    arrI = arr[i];
    if (arrI !== 0) {
      j = result2[k];
      if (arr[j] < arrI) {
        p2[i] = j;
        result2[++k] = i;
        continue;
      }
      u = 0;
      v = k;
      while (u < v) {
        c = u + v >> 1;
        if (arr[result2[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result2[u]]) {
        if (u > 0) {
          p2[i] = result2[u - 1];
        }
        result2[u] = i;
      }
    }
  }
  u = k + 1;
  var seq = new Int32Array(u);
  v = result2[u - 1];
  while (u-- > 0) {
    seq[u] = v;
    v = p2[v];
    result2[u] = 0;
  }
  return seq;
}
var hasDocumentAvailable2 = typeof document !== "undefined";
if (hasDocumentAvailable2) {
  if (window.Node) {
    Node.prototype.$EV = null;
    Node.prototype.$V = null;
  }
}
var COMPONENTS_QUEUE2 = [];
var nextTick2 = typeof Promise !== "undefined" ? Promise.resolve().then.bind(Promise.resolve()) : function(a) {
  window.setTimeout(a, 0);
};
var microTaskPending2 = false;
function queueStateChanges2(component, newState, callback, force) {
  var pending = component.$PS;
  if (isFunction2(newState)) {
    newState = newState(pending ? combineFrom2(component.state, pending) : component.state, component.props, component.context);
  }
  if (isNullOrUndef3(pending)) {
    component.$PS = newState;
  } else {
    for (var stateKey in newState) {
      pending[stateKey] = newState[stateKey];
    }
  }
  if (!component.$BR) {
    if (!renderCheck2.v) {
      if (COMPONENTS_QUEUE2.length === 0) {
        applyState2(component, force);
        if (isFunction2(callback)) {
          callback.call(component);
        }
        return;
      }
    }
    if (COMPONENTS_QUEUE2.indexOf(component) === -1) {
      COMPONENTS_QUEUE2.push(component);
    }
    if (force) {
      component.$F = true;
    }
    if (!microTaskPending2) {
      microTaskPending2 = true;
      nextTick2(rerender2);
    }
    if (isFunction2(callback)) {
      var QU = component.$QU;
      if (!QU) {
        QU = component.$QU = [];
      }
      QU.push(callback);
    }
  } else if (isFunction2(callback)) {
    component.$L.push(callback.bind(component));
  }
}
function callSetStateCallbacks2(component) {
  var queue = component.$QU;
  for (var i = 0;i < queue.length; ++i) {
    queue[i].call(component);
  }
  component.$QU = null;
}
function rerender2() {
  var component;
  microTaskPending2 = false;
  while (component = COMPONENTS_QUEUE2.shift()) {
    if (!component.$UN) {
      var force = component.$F;
      component.$F = false;
      applyState2(component, force);
      if (component.$QU) {
        callSetStateCallbacks2(component);
      }
    }
  }
}
function applyState2(component, force) {
  if (force || !component.$BR) {
    var pendingState = component.$PS;
    component.$PS = null;
    var lifecycle = [];
    var animations = new AnimationQueues3;
    renderCheck2.v = true;
    updateClassComponent2(component, combineFrom2(component.state, pendingState), component.props, findDOMFromVNode2(component.$LI, true).parentNode, component.context, component.$SVG, force, null, lifecycle, animations);
    callAll2(lifecycle);
    callAllAnimationHooks2(animations.componentDidAppear);
    renderCheck2.v = false;
  } else {
    component.state = component.$PS;
    component.$PS = null;
  }
}
var Component2 = /* @__PURE__ */ function() {
  function Component3(props, context) {
    this.state = null;
    this.props = undefined;
    this.context = undefined;
    this.displayName = undefined;
    this.$BR = false;
    this.$BS = true;
    this.$PS = null;
    this.$LI = null;
    this.$UN = false;
    this.$CX = null;
    this.$QU = null;
    this.$N = false;
    this.$SSR = undefined;
    this.$L = null;
    this.$SVG = false;
    this.$F = false;
    this.props = props || EMPTY_OBJ2;
    this.context = context || EMPTY_OBJ2;
  }
  var _proto = Component3.prototype;
  _proto.forceUpdate = function forceUpdate(callback) {
    if (this.$UN) {
      return;
    }
    queueStateChanges2(this, {}, callback, true);
  };
  _proto.setState = function setState(newState, callback) {
    if (this.$UN) {
      return;
    }
    if (!this.$BS) {
      queueStateChanges2(this, newState, callback, false);
    }
  };
  _proto.render = function render(props, state, context) {
    return null;
  };
  return Component3;
}();
Component2.defaultProps = null;

// ../blazecn/node_modules/inferno/index.esm.js
if (true) {
  console.warn("You are running production build of Inferno in development mode. Use dev:module entry point.");
}

// ../blazecn/node_modules/inferno-create-element/dist/index.esm.js
function isNullOrUndef4(o) {
  return o === undefined || o === null;
}
function isString4(o) {
  return typeof o === "string";
}
function isUndefined4(o) {
  return o === undefined;
}
var componentHooks2 = {
  onComponentDidAppear: 1,
  onComponentDidMount: 1,
  onComponentDidUpdate: 1,
  onComponentShouldUpdate: 1,
  onComponentWillDisappear: 1,
  onComponentWillMount: 1,
  onComponentWillUnmount: 1,
  onComponentWillUpdate: 1
};
function createElement2(type, props, _children) {
  var children;
  var ref = null;
  var key = null;
  var className = null;
  var flags;
  var newProps;
  var childLen = arguments.length - 2;
  if (childLen === 1) {
    children = _children;
  } else if (childLen > 1) {
    children = [];
    while (childLen-- > 0) {
      children[childLen] = arguments[childLen + 2];
    }
  }
  if (isString4(type)) {
    flags = getFlagsForElementVnode2(type);
    if (!isNullOrUndef4(props)) {
      newProps = {};
      for (var prop in props) {
        if (prop === "className" || prop === "class") {
          className = props[prop];
        } else if (prop === "key") {
          key = props.key;
        } else if (prop === "children" && isUndefined4(children)) {
          children = props.children;
        } else if (prop === "ref") {
          ref = props.ref;
        } else {
          if (prop === "contenteditable") {
            flags |= 4096;
          }
          newProps[prop] = props[prop];
        }
      }
    }
  } else {
    flags = 2;
    if (!isUndefined4(children)) {
      if (!props) {
        props = {};
      }
      props.children = children;
    }
    if (!isNullOrUndef4(props)) {
      newProps = {};
      for (var _prop in props) {
        if (_prop === "key") {
          key = props.key;
        } else if (_prop === "ref") {
          ref = props.ref;
        } else if (componentHooks2[_prop] === 1) {
          if (!ref) {
            ref = {};
          }
          ref[_prop] = props[_prop];
        } else {
          newProps[_prop] = props[_prop];
        }
      }
    }
    return createComponentVNode2(flags, type, newProps, key, ref);
  }
  if (flags & 8192) {
    return createFragment2(childLen === 1 ? [children] : children, 0, key);
  }
  return createVNode2(flags, type, className, children, 0, newProps, key, ref);
}

// ../blazecn/node_modules/clsx/dist/clsx.mjs
function r2(e) {
  var t, f, n = "";
  if (typeof e == "string" || typeof e == "number")
    n += e;
  else if (typeof e == "object")
    if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0;t < o; t++)
        e[t] && (f = r2(e[t])) && (n && (n += " "), n += f);
    } else
      for (f in e)
        e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx2() {
  for (var e, t, f = 0, n = "", o = arguments.length;f < o; f++)
    (e = arguments[f]) && (t = r2(e)) && (n && (n += " "), n += t);
  return n;
}

// ../blazecn/node_modules/tailwind-merge/dist/bundle-mjs.mjs
var concatArrays2 = (array1, array2) => {
  const combinedArray = new Array(array1.length + array2.length);
  for (let i = 0;i < array1.length; i++) {
    combinedArray[i] = array1[i];
  }
  for (let i = 0;i < array2.length; i++) {
    combinedArray[array1.length + i] = array2[i];
  }
  return combinedArray;
};
var createClassValidatorObject2 = (classGroupId, validator) => ({
  classGroupId,
  validator
});
var createClassPartObject2 = (nextPart = new Map, validators = null, classGroupId) => ({
  nextPart,
  validators,
  classGroupId
});
var CLASS_PART_SEPARATOR2 = "-";
var EMPTY_CONFLICTS2 = [];
var ARBITRARY_PROPERTY_PREFIX2 = "arbitrary..";
var createClassGroupUtils2 = (config) => {
  const classMap = createClassMap2(config);
  const {
    conflictingClassGroups,
    conflictingClassGroupModifiers
  } = config;
  const getClassGroupId = (className) => {
    if (className.startsWith("[") && className.endsWith("]")) {
      return getGroupIdForArbitraryProperty2(className);
    }
    const classParts = className.split(CLASS_PART_SEPARATOR2);
    const startIndex = classParts[0] === "" && classParts.length > 1 ? 1 : 0;
    return getGroupRecursive2(classParts, startIndex, classMap);
  };
  const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
    if (hasPostfixModifier) {
      const modifierConflicts = conflictingClassGroupModifiers[classGroupId];
      const baseConflicts = conflictingClassGroups[classGroupId];
      if (modifierConflicts) {
        if (baseConflicts) {
          return concatArrays2(baseConflicts, modifierConflicts);
        }
        return modifierConflicts;
      }
      return baseConflicts || EMPTY_CONFLICTS2;
    }
    return conflictingClassGroups[classGroupId] || EMPTY_CONFLICTS2;
  };
  return {
    getClassGroupId,
    getConflictingClassGroupIds
  };
};
var getGroupRecursive2 = (classParts, startIndex, classPartObject) => {
  const classPathsLength = classParts.length - startIndex;
  if (classPathsLength === 0) {
    return classPartObject.classGroupId;
  }
  const currentClassPart = classParts[startIndex];
  const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
  if (nextClassPartObject) {
    const result3 = getGroupRecursive2(classParts, startIndex + 1, nextClassPartObject);
    if (result3)
      return result3;
  }
  const validators = classPartObject.validators;
  if (validators === null) {
    return;
  }
  const classRest = startIndex === 0 ? classParts.join(CLASS_PART_SEPARATOR2) : classParts.slice(startIndex).join(CLASS_PART_SEPARATOR2);
  const validatorsLength = validators.length;
  for (let i = 0;i < validatorsLength; i++) {
    const validatorObj = validators[i];
    if (validatorObj.validator(classRest)) {
      return validatorObj.classGroupId;
    }
  }
  return;
};
var getGroupIdForArbitraryProperty2 = (className) => className.slice(1, -1).indexOf(":") === -1 ? undefined : (() => {
  const content = className.slice(1, -1);
  const colonIndex = content.indexOf(":");
  const property = content.slice(0, colonIndex);
  return property ? ARBITRARY_PROPERTY_PREFIX2 + property : undefined;
})();
var createClassMap2 = (config) => {
  const {
    theme,
    classGroups
  } = config;
  return processClassGroups2(classGroups, theme);
};
var processClassGroups2 = (classGroups, theme) => {
  const classMap = createClassPartObject2();
  for (const classGroupId in classGroups) {
    const group = classGroups[classGroupId];
    processClassesRecursively2(group, classMap, classGroupId, theme);
  }
  return classMap;
};
var processClassesRecursively2 = (classGroup, classPartObject, classGroupId, theme) => {
  const len = classGroup.length;
  for (let i = 0;i < len; i++) {
    const classDefinition = classGroup[i];
    processClassDefinition2(classDefinition, classPartObject, classGroupId, theme);
  }
};
var processClassDefinition2 = (classDefinition, classPartObject, classGroupId, theme) => {
  if (typeof classDefinition === "string") {
    processStringDefinition2(classDefinition, classPartObject, classGroupId);
    return;
  }
  if (typeof classDefinition === "function") {
    processFunctionDefinition2(classDefinition, classPartObject, classGroupId, theme);
    return;
  }
  processObjectDefinition2(classDefinition, classPartObject, classGroupId, theme);
};
var processStringDefinition2 = (classDefinition, classPartObject, classGroupId) => {
  const classPartObjectToEdit = classDefinition === "" ? classPartObject : getPart2(classPartObject, classDefinition);
  classPartObjectToEdit.classGroupId = classGroupId;
};
var processFunctionDefinition2 = (classDefinition, classPartObject, classGroupId, theme) => {
  if (isThemeGetter2(classDefinition)) {
    processClassesRecursively2(classDefinition(theme), classPartObject, classGroupId, theme);
    return;
  }
  if (classPartObject.validators === null) {
    classPartObject.validators = [];
  }
  classPartObject.validators.push(createClassValidatorObject2(classGroupId, classDefinition));
};
var processObjectDefinition2 = (classDefinition, classPartObject, classGroupId, theme) => {
  const entries = Object.entries(classDefinition);
  const len = entries.length;
  for (let i = 0;i < len; i++) {
    const [key, value] = entries[i];
    processClassesRecursively2(value, getPart2(classPartObject, key), classGroupId, theme);
  }
};
var getPart2 = (classPartObject, path) => {
  let current = classPartObject;
  const parts = path.split(CLASS_PART_SEPARATOR2);
  const len = parts.length;
  for (let i = 0;i < len; i++) {
    const part = parts[i];
    let next = current.nextPart.get(part);
    if (!next) {
      next = createClassPartObject2();
      current.nextPart.set(part, next);
    }
    current = next;
  }
  return current;
};
var isThemeGetter2 = (func) => ("isThemeGetter" in func) && func.isThemeGetter === true;
var createLruCache2 = (maxCacheSize) => {
  if (maxCacheSize < 1) {
    return {
      get: () => {
        return;
      },
      set: () => {}
    };
  }
  let cacheSize = 0;
  let cache = Object.create(null);
  let previousCache = Object.create(null);
  const update = (key, value) => {
    cache[key] = value;
    cacheSize++;
    if (cacheSize > maxCacheSize) {
      cacheSize = 0;
      previousCache = cache;
      cache = Object.create(null);
    }
  };
  return {
    get(key) {
      let value = cache[key];
      if (value !== undefined) {
        return value;
      }
      if ((value = previousCache[key]) !== undefined) {
        update(key, value);
        return value;
      }
    },
    set(key, value) {
      if (key in cache) {
        cache[key] = value;
      } else {
        update(key, value);
      }
    }
  };
};
var IMPORTANT_MODIFIER2 = "!";
var MODIFIER_SEPARATOR2 = ":";
var EMPTY_MODIFIERS2 = [];
var createResultObject2 = (modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition, isExternal) => ({
  modifiers,
  hasImportantModifier,
  baseClassName,
  maybePostfixModifierPosition,
  isExternal
});
var createParseClassName2 = (config) => {
  const {
    prefix,
    experimentalParseClassName
  } = config;
  let parseClassName = (className) => {
    const modifiers = [];
    let bracketDepth = 0;
    let parenDepth = 0;
    let modifierStart = 0;
    let postfixModifierPosition;
    const len = className.length;
    for (let index = 0;index < len; index++) {
      const currentCharacter = className[index];
      if (bracketDepth === 0 && parenDepth === 0) {
        if (currentCharacter === MODIFIER_SEPARATOR2) {
          modifiers.push(className.slice(modifierStart, index));
          modifierStart = index + 1;
          continue;
        }
        if (currentCharacter === "/") {
          postfixModifierPosition = index;
          continue;
        }
      }
      if (currentCharacter === "[")
        bracketDepth++;
      else if (currentCharacter === "]")
        bracketDepth--;
      else if (currentCharacter === "(")
        parenDepth++;
      else if (currentCharacter === ")")
        parenDepth--;
    }
    const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.slice(modifierStart);
    let baseClassName = baseClassNameWithImportantModifier;
    let hasImportantModifier = false;
    if (baseClassNameWithImportantModifier.endsWith(IMPORTANT_MODIFIER2)) {
      baseClassName = baseClassNameWithImportantModifier.slice(0, -1);
      hasImportantModifier = true;
    } else if (baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER2)) {
      baseClassName = baseClassNameWithImportantModifier.slice(1);
      hasImportantModifier = true;
    }
    const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : undefined;
    return createResultObject2(modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition);
  };
  if (prefix) {
    const fullPrefix = prefix + MODIFIER_SEPARATOR2;
    const parseClassNameOriginal = parseClassName;
    parseClassName = (className) => className.startsWith(fullPrefix) ? parseClassNameOriginal(className.slice(fullPrefix.length)) : createResultObject2(EMPTY_MODIFIERS2, false, className, undefined, true);
  }
  if (experimentalParseClassName) {
    const parseClassNameOriginal = parseClassName;
    parseClassName = (className) => experimentalParseClassName({
      className,
      parseClassName: parseClassNameOriginal
    });
  }
  return parseClassName;
};
var createSortModifiers2 = (config) => {
  const modifierWeights = new Map;
  config.orderSensitiveModifiers.forEach((mod, index) => {
    modifierWeights.set(mod, 1e6 + index);
  });
  return (modifiers) => {
    const result3 = [];
    let currentSegment = [];
    for (let i = 0;i < modifiers.length; i++) {
      const modifier = modifiers[i];
      const isArbitrary = modifier[0] === "[";
      const isOrderSensitive = modifierWeights.has(modifier);
      if (isArbitrary || isOrderSensitive) {
        if (currentSegment.length > 0) {
          currentSegment.sort();
          result3.push(...currentSegment);
          currentSegment = [];
        }
        result3.push(modifier);
      } else {
        currentSegment.push(modifier);
      }
    }
    if (currentSegment.length > 0) {
      currentSegment.sort();
      result3.push(...currentSegment);
    }
    return result3;
  };
};
var createConfigUtils2 = (config) => ({
  cache: createLruCache2(config.cacheSize),
  parseClassName: createParseClassName2(config),
  sortModifiers: createSortModifiers2(config),
  ...createClassGroupUtils2(config)
});
var SPLIT_CLASSES_REGEX2 = /\s+/;
var mergeClassList2 = (classList, configUtils) => {
  const {
    parseClassName,
    getClassGroupId,
    getConflictingClassGroupIds,
    sortModifiers
  } = configUtils;
  const classGroupsInConflict = [];
  const classNames = classList.trim().split(SPLIT_CLASSES_REGEX2);
  let result3 = "";
  for (let index = classNames.length - 1;index >= 0; index -= 1) {
    const originalClassName = classNames[index];
    const {
      isExternal,
      modifiers,
      hasImportantModifier,
      baseClassName,
      maybePostfixModifierPosition
    } = parseClassName(originalClassName);
    if (isExternal) {
      result3 = originalClassName + (result3.length > 0 ? " " + result3 : result3);
      continue;
    }
    let hasPostfixModifier = !!maybePostfixModifierPosition;
    let classGroupId = getClassGroupId(hasPostfixModifier ? baseClassName.substring(0, maybePostfixModifierPosition) : baseClassName);
    if (!classGroupId) {
      if (!hasPostfixModifier) {
        result3 = originalClassName + (result3.length > 0 ? " " + result3 : result3);
        continue;
      }
      classGroupId = getClassGroupId(baseClassName);
      if (!classGroupId) {
        result3 = originalClassName + (result3.length > 0 ? " " + result3 : result3);
        continue;
      }
      hasPostfixModifier = false;
    }
    const variantModifier = modifiers.length === 0 ? "" : modifiers.length === 1 ? modifiers[0] : sortModifiers(modifiers).join(":");
    const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER2 : variantModifier;
    const classId = modifierId + classGroupId;
    if (classGroupsInConflict.indexOf(classId) > -1) {
      continue;
    }
    classGroupsInConflict.push(classId);
    const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
    for (let i = 0;i < conflictGroups.length; ++i) {
      const group = conflictGroups[i];
      classGroupsInConflict.push(modifierId + group);
    }
    result3 = originalClassName + (result3.length > 0 ? " " + result3 : result3);
  }
  return result3;
};
var twJoin2 = (...classLists) => {
  let index = 0;
  let argument;
  let resolvedValue;
  let string = "";
  while (index < classLists.length) {
    if (argument = classLists[index++]) {
      if (resolvedValue = toValue2(argument)) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
};
var toValue2 = (mix) => {
  if (typeof mix === "string") {
    return mix;
  }
  let resolvedValue;
  let string = "";
  for (let k = 0;k < mix.length; k++) {
    if (mix[k]) {
      if (resolvedValue = toValue2(mix[k])) {
        string && (string += " ");
        string += resolvedValue;
      }
    }
  }
  return string;
};
var createTailwindMerge2 = (createConfigFirst, ...createConfigRest) => {
  let configUtils;
  let cacheGet;
  let cacheSet;
  let functionToCall;
  const initTailwindMerge = (classList) => {
    const config = createConfigRest.reduce((previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig), createConfigFirst());
    configUtils = createConfigUtils2(config);
    cacheGet = configUtils.cache.get;
    cacheSet = configUtils.cache.set;
    functionToCall = tailwindMerge;
    return tailwindMerge(classList);
  };
  const tailwindMerge = (classList) => {
    const cachedResult = cacheGet(classList);
    if (cachedResult) {
      return cachedResult;
    }
    const result3 = mergeClassList2(classList, configUtils);
    cacheSet(classList, result3);
    return result3;
  };
  functionToCall = initTailwindMerge;
  return (...args) => functionToCall(twJoin2(...args));
};
var fallbackThemeArr2 = [];
var fromTheme2 = (key) => {
  const themeGetter = (theme) => theme[key] || fallbackThemeArr2;
  themeGetter.isThemeGetter = true;
  return themeGetter;
};
var arbitraryValueRegex2 = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
var arbitraryVariableRegex2 = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
var fractionRegex2 = /^\d+\/\d+$/;
var tshirtUnitRegex2 = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
var lengthUnitRegex2 = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
var colorFunctionRegex2 = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
var shadowRegex2 = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
var imageRegex2 = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
var isFraction2 = (value) => fractionRegex2.test(value);
var isNumber4 = (value) => !!value && !Number.isNaN(Number(value));
var isInteger2 = (value) => !!value && Number.isInteger(Number(value));
var isPercent2 = (value) => value.endsWith("%") && isNumber4(value.slice(0, -1));
var isTshirtSize2 = (value) => tshirtUnitRegex2.test(value);
var isAny2 = () => true;
var isLengthOnly2 = (value) => lengthUnitRegex2.test(value) && !colorFunctionRegex2.test(value);
var isNever2 = () => false;
var isShadow2 = (value) => shadowRegex2.test(value);
var isImage2 = (value) => imageRegex2.test(value);
var isAnyNonArbitrary2 = (value) => !isArbitraryValue2(value) && !isArbitraryVariable2(value);
var isArbitrarySize2 = (value) => getIsArbitraryValue2(value, isLabelSize2, isNever2);
var isArbitraryValue2 = (value) => arbitraryValueRegex2.test(value);
var isArbitraryLength2 = (value) => getIsArbitraryValue2(value, isLabelLength2, isLengthOnly2);
var isArbitraryNumber2 = (value) => getIsArbitraryValue2(value, isLabelNumber2, isNumber4);
var isArbitraryWeight2 = (value) => getIsArbitraryValue2(value, isLabelWeight2, isAny2);
var isArbitraryFamilyName2 = (value) => getIsArbitraryValue2(value, isLabelFamilyName2, isNever2);
var isArbitraryPosition2 = (value) => getIsArbitraryValue2(value, isLabelPosition2, isNever2);
var isArbitraryImage2 = (value) => getIsArbitraryValue2(value, isLabelImage2, isImage2);
var isArbitraryShadow2 = (value) => getIsArbitraryValue2(value, isLabelShadow2, isShadow2);
var isArbitraryVariable2 = (value) => arbitraryVariableRegex2.test(value);
var isArbitraryVariableLength2 = (value) => getIsArbitraryVariable2(value, isLabelLength2);
var isArbitraryVariableFamilyName2 = (value) => getIsArbitraryVariable2(value, isLabelFamilyName2);
var isArbitraryVariablePosition2 = (value) => getIsArbitraryVariable2(value, isLabelPosition2);
var isArbitraryVariableSize2 = (value) => getIsArbitraryVariable2(value, isLabelSize2);
var isArbitraryVariableImage2 = (value) => getIsArbitraryVariable2(value, isLabelImage2);
var isArbitraryVariableShadow2 = (value) => getIsArbitraryVariable2(value, isLabelShadow2, true);
var isArbitraryVariableWeight2 = (value) => getIsArbitraryVariable2(value, isLabelWeight2, true);
var getIsArbitraryValue2 = (value, testLabel, testValue) => {
  const result3 = arbitraryValueRegex2.exec(value);
  if (result3) {
    if (result3[1]) {
      return testLabel(result3[1]);
    }
    return testValue(result3[2]);
  }
  return false;
};
var getIsArbitraryVariable2 = (value, testLabel, shouldMatchNoLabel = false) => {
  const result3 = arbitraryVariableRegex2.exec(value);
  if (result3) {
    if (result3[1]) {
      return testLabel(result3[1]);
    }
    return shouldMatchNoLabel;
  }
  return false;
};
var isLabelPosition2 = (label) => label === "position" || label === "percentage";
var isLabelImage2 = (label) => label === "image" || label === "url";
var isLabelSize2 = (label) => label === "length" || label === "size" || label === "bg-size";
var isLabelLength2 = (label) => label === "length";
var isLabelNumber2 = (label) => label === "number";
var isLabelFamilyName2 = (label) => label === "family-name";
var isLabelWeight2 = (label) => label === "number" || label === "weight";
var isLabelShadow2 = (label) => label === "shadow";
var getDefaultConfig2 = () => {
  const themeColor = fromTheme2("color");
  const themeFont = fromTheme2("font");
  const themeText = fromTheme2("text");
  const themeFontWeight = fromTheme2("font-weight");
  const themeTracking = fromTheme2("tracking");
  const themeLeading = fromTheme2("leading");
  const themeBreakpoint = fromTheme2("breakpoint");
  const themeContainer = fromTheme2("container");
  const themeSpacing = fromTheme2("spacing");
  const themeRadius = fromTheme2("radius");
  const themeShadow = fromTheme2("shadow");
  const themeInsetShadow = fromTheme2("inset-shadow");
  const themeTextShadow = fromTheme2("text-shadow");
  const themeDropShadow = fromTheme2("drop-shadow");
  const themeBlur = fromTheme2("blur");
  const themePerspective = fromTheme2("perspective");
  const themeAspect = fromTheme2("aspect");
  const themeEase = fromTheme2("ease");
  const themeAnimate = fromTheme2("animate");
  const scaleBreak = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"];
  const scalePosition = () => [
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top-left",
    "left-top",
    "top-right",
    "right-top",
    "bottom-right",
    "right-bottom",
    "bottom-left",
    "left-bottom"
  ];
  const scalePositionWithArbitrary = () => [...scalePosition(), isArbitraryVariable2, isArbitraryValue2];
  const scaleOverflow = () => ["auto", "hidden", "clip", "visible", "scroll"];
  const scaleOverscroll = () => ["auto", "contain", "none"];
  const scaleUnambiguousSpacing = () => [isArbitraryVariable2, isArbitraryValue2, themeSpacing];
  const scaleInset = () => [isFraction2, "full", "auto", ...scaleUnambiguousSpacing()];
  const scaleGridTemplateColsRows = () => [isInteger2, "none", "subgrid", isArbitraryVariable2, isArbitraryValue2];
  const scaleGridColRowStartAndEnd = () => ["auto", {
    span: ["full", isInteger2, isArbitraryVariable2, isArbitraryValue2]
  }, isInteger2, isArbitraryVariable2, isArbitraryValue2];
  const scaleGridColRowStartOrEnd = () => [isInteger2, "auto", isArbitraryVariable2, isArbitraryValue2];
  const scaleGridAutoColsRows = () => ["auto", "min", "max", "fr", isArbitraryVariable2, isArbitraryValue2];
  const scaleAlignPrimaryAxis = () => ["start", "end", "center", "between", "around", "evenly", "stretch", "baseline", "center-safe", "end-safe"];
  const scaleAlignSecondaryAxis = () => ["start", "end", "center", "stretch", "center-safe", "end-safe"];
  const scaleMargin = () => ["auto", ...scaleUnambiguousSpacing()];
  const scaleSizing = () => [isFraction2, "auto", "full", "dvw", "dvh", "lvw", "lvh", "svw", "svh", "min", "max", "fit", ...scaleUnambiguousSpacing()];
  const scaleColor = () => [themeColor, isArbitraryVariable2, isArbitraryValue2];
  const scaleBgPosition = () => [...scalePosition(), isArbitraryVariablePosition2, isArbitraryPosition2, {
    position: [isArbitraryVariable2, isArbitraryValue2]
  }];
  const scaleBgRepeat = () => ["no-repeat", {
    repeat: ["", "x", "y", "space", "round"]
  }];
  const scaleBgSize = () => ["auto", "cover", "contain", isArbitraryVariableSize2, isArbitrarySize2, {
    size: [isArbitraryVariable2, isArbitraryValue2]
  }];
  const scaleGradientStopPosition = () => [isPercent2, isArbitraryVariableLength2, isArbitraryLength2];
  const scaleRadius = () => [
    "",
    "none",
    "full",
    themeRadius,
    isArbitraryVariable2,
    isArbitraryValue2
  ];
  const scaleBorderWidth = () => ["", isNumber4, isArbitraryVariableLength2, isArbitraryLength2];
  const scaleLineStyle = () => ["solid", "dashed", "dotted", "double"];
  const scaleBlendMode = () => ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];
  const scaleMaskImagePosition = () => [isNumber4, isPercent2, isArbitraryVariablePosition2, isArbitraryPosition2];
  const scaleBlur = () => [
    "",
    "none",
    themeBlur,
    isArbitraryVariable2,
    isArbitraryValue2
  ];
  const scaleRotate = () => ["none", isNumber4, isArbitraryVariable2, isArbitraryValue2];
  const scaleScale = () => ["none", isNumber4, isArbitraryVariable2, isArbitraryValue2];
  const scaleSkew = () => [isNumber4, isArbitraryVariable2, isArbitraryValue2];
  const scaleTranslate = () => [isFraction2, "full", ...scaleUnambiguousSpacing()];
  return {
    cacheSize: 500,
    theme: {
      animate: ["spin", "ping", "pulse", "bounce"],
      aspect: ["video"],
      blur: [isTshirtSize2],
      breakpoint: [isTshirtSize2],
      color: [isAny2],
      container: [isTshirtSize2],
      "drop-shadow": [isTshirtSize2],
      ease: ["in", "out", "in-out"],
      font: [isAnyNonArbitrary2],
      "font-weight": ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black"],
      "inset-shadow": [isTshirtSize2],
      leading: ["none", "tight", "snug", "normal", "relaxed", "loose"],
      perspective: ["dramatic", "near", "normal", "midrange", "distant", "none"],
      radius: [isTshirtSize2],
      shadow: [isTshirtSize2],
      spacing: ["px", isNumber4],
      text: [isTshirtSize2],
      "text-shadow": [isTshirtSize2],
      tracking: ["tighter", "tight", "normal", "wide", "wider", "widest"]
    },
    classGroups: {
      aspect: [{
        aspect: ["auto", "square", isFraction2, isArbitraryValue2, isArbitraryVariable2, themeAspect]
      }],
      container: ["container"],
      columns: [{
        columns: [isNumber4, isArbitraryValue2, isArbitraryVariable2, themeContainer]
      }],
      "break-after": [{
        "break-after": scaleBreak()
      }],
      "break-before": [{
        "break-before": scaleBreak()
      }],
      "break-inside": [{
        "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"]
      }],
      "box-decoration": [{
        "box-decoration": ["slice", "clone"]
      }],
      box: [{
        box: ["border", "content"]
      }],
      display: ["block", "inline-block", "inline", "flex", "inline-flex", "table", "inline-table", "table-caption", "table-cell", "table-column", "table-column-group", "table-footer-group", "table-header-group", "table-row-group", "table-row", "flow-root", "grid", "inline-grid", "contents", "list-item", "hidden"],
      sr: ["sr-only", "not-sr-only"],
      float: [{
        float: ["right", "left", "none", "start", "end"]
      }],
      clear: [{
        clear: ["left", "right", "both", "none", "start", "end"]
      }],
      isolation: ["isolate", "isolation-auto"],
      "object-fit": [{
        object: ["contain", "cover", "fill", "none", "scale-down"]
      }],
      "object-position": [{
        object: scalePositionWithArbitrary()
      }],
      overflow: [{
        overflow: scaleOverflow()
      }],
      "overflow-x": [{
        "overflow-x": scaleOverflow()
      }],
      "overflow-y": [{
        "overflow-y": scaleOverflow()
      }],
      overscroll: [{
        overscroll: scaleOverscroll()
      }],
      "overscroll-x": [{
        "overscroll-x": scaleOverscroll()
      }],
      "overscroll-y": [{
        "overscroll-y": scaleOverscroll()
      }],
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      inset: [{
        inset: scaleInset()
      }],
      "inset-x": [{
        "inset-x": scaleInset()
      }],
      "inset-y": [{
        "inset-y": scaleInset()
      }],
      start: [{
        start: scaleInset()
      }],
      end: [{
        end: scaleInset()
      }],
      top: [{
        top: scaleInset()
      }],
      right: [{
        right: scaleInset()
      }],
      bottom: [{
        bottom: scaleInset()
      }],
      left: [{
        left: scaleInset()
      }],
      visibility: ["visible", "invisible", "collapse"],
      z: [{
        z: [isInteger2, "auto", isArbitraryVariable2, isArbitraryValue2]
      }],
      basis: [{
        basis: [isFraction2, "full", "auto", themeContainer, ...scaleUnambiguousSpacing()]
      }],
      "flex-direction": [{
        flex: ["row", "row-reverse", "col", "col-reverse"]
      }],
      "flex-wrap": [{
        flex: ["nowrap", "wrap", "wrap-reverse"]
      }],
      flex: [{
        flex: [isNumber4, isFraction2, "auto", "initial", "none", isArbitraryValue2]
      }],
      grow: [{
        grow: ["", isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      shrink: [{
        shrink: ["", isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      order: [{
        order: [isInteger2, "first", "last", "none", isArbitraryVariable2, isArbitraryValue2]
      }],
      "grid-cols": [{
        "grid-cols": scaleGridTemplateColsRows()
      }],
      "col-start-end": [{
        col: scaleGridColRowStartAndEnd()
      }],
      "col-start": [{
        "col-start": scaleGridColRowStartOrEnd()
      }],
      "col-end": [{
        "col-end": scaleGridColRowStartOrEnd()
      }],
      "grid-rows": [{
        "grid-rows": scaleGridTemplateColsRows()
      }],
      "row-start-end": [{
        row: scaleGridColRowStartAndEnd()
      }],
      "row-start": [{
        "row-start": scaleGridColRowStartOrEnd()
      }],
      "row-end": [{
        "row-end": scaleGridColRowStartOrEnd()
      }],
      "grid-flow": [{
        "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"]
      }],
      "auto-cols": [{
        "auto-cols": scaleGridAutoColsRows()
      }],
      "auto-rows": [{
        "auto-rows": scaleGridAutoColsRows()
      }],
      gap: [{
        gap: scaleUnambiguousSpacing()
      }],
      "gap-x": [{
        "gap-x": scaleUnambiguousSpacing()
      }],
      "gap-y": [{
        "gap-y": scaleUnambiguousSpacing()
      }],
      "justify-content": [{
        justify: [...scaleAlignPrimaryAxis(), "normal"]
      }],
      "justify-items": [{
        "justify-items": [...scaleAlignSecondaryAxis(), "normal"]
      }],
      "justify-self": [{
        "justify-self": ["auto", ...scaleAlignSecondaryAxis()]
      }],
      "align-content": [{
        content: ["normal", ...scaleAlignPrimaryAxis()]
      }],
      "align-items": [{
        items: [...scaleAlignSecondaryAxis(), {
          baseline: ["", "last"]
        }]
      }],
      "align-self": [{
        self: ["auto", ...scaleAlignSecondaryAxis(), {
          baseline: ["", "last"]
        }]
      }],
      "place-content": [{
        "place-content": scaleAlignPrimaryAxis()
      }],
      "place-items": [{
        "place-items": [...scaleAlignSecondaryAxis(), "baseline"]
      }],
      "place-self": [{
        "place-self": ["auto", ...scaleAlignSecondaryAxis()]
      }],
      p: [{
        p: scaleUnambiguousSpacing()
      }],
      px: [{
        px: scaleUnambiguousSpacing()
      }],
      py: [{
        py: scaleUnambiguousSpacing()
      }],
      ps: [{
        ps: scaleUnambiguousSpacing()
      }],
      pe: [{
        pe: scaleUnambiguousSpacing()
      }],
      pt: [{
        pt: scaleUnambiguousSpacing()
      }],
      pr: [{
        pr: scaleUnambiguousSpacing()
      }],
      pb: [{
        pb: scaleUnambiguousSpacing()
      }],
      pl: [{
        pl: scaleUnambiguousSpacing()
      }],
      m: [{
        m: scaleMargin()
      }],
      mx: [{
        mx: scaleMargin()
      }],
      my: [{
        my: scaleMargin()
      }],
      ms: [{
        ms: scaleMargin()
      }],
      me: [{
        me: scaleMargin()
      }],
      mt: [{
        mt: scaleMargin()
      }],
      mr: [{
        mr: scaleMargin()
      }],
      mb: [{
        mb: scaleMargin()
      }],
      ml: [{
        ml: scaleMargin()
      }],
      "space-x": [{
        "space-x": scaleUnambiguousSpacing()
      }],
      "space-x-reverse": ["space-x-reverse"],
      "space-y": [{
        "space-y": scaleUnambiguousSpacing()
      }],
      "space-y-reverse": ["space-y-reverse"],
      size: [{
        size: scaleSizing()
      }],
      w: [{
        w: [themeContainer, "screen", ...scaleSizing()]
      }],
      "min-w": [{
        "min-w": [
          themeContainer,
          "screen",
          "none",
          ...scaleSizing()
        ]
      }],
      "max-w": [{
        "max-w": [
          themeContainer,
          "screen",
          "none",
          "prose",
          {
            screen: [themeBreakpoint]
          },
          ...scaleSizing()
        ]
      }],
      h: [{
        h: ["screen", "lh", ...scaleSizing()]
      }],
      "min-h": [{
        "min-h": ["screen", "lh", "none", ...scaleSizing()]
      }],
      "max-h": [{
        "max-h": ["screen", "lh", ...scaleSizing()]
      }],
      "font-size": [{
        text: ["base", themeText, isArbitraryVariableLength2, isArbitraryLength2]
      }],
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      "font-style": ["italic", "not-italic"],
      "font-weight": [{
        font: [themeFontWeight, isArbitraryVariableWeight2, isArbitraryWeight2]
      }],
      "font-stretch": [{
        "font-stretch": ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded", "extra-expanded", "ultra-expanded", isPercent2, isArbitraryValue2]
      }],
      "font-family": [{
        font: [isArbitraryVariableFamilyName2, isArbitraryFamilyName2, themeFont]
      }],
      "fvn-normal": ["normal-nums"],
      "fvn-ordinal": ["ordinal"],
      "fvn-slashed-zero": ["slashed-zero"],
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      "fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
      tracking: [{
        tracking: [themeTracking, isArbitraryVariable2, isArbitraryValue2]
      }],
      "line-clamp": [{
        "line-clamp": [isNumber4, "none", isArbitraryVariable2, isArbitraryNumber2]
      }],
      leading: [{
        leading: [
          themeLeading,
          ...scaleUnambiguousSpacing()
        ]
      }],
      "list-image": [{
        "list-image": ["none", isArbitraryVariable2, isArbitraryValue2]
      }],
      "list-style-position": [{
        list: ["inside", "outside"]
      }],
      "list-style-type": [{
        list: ["disc", "decimal", "none", isArbitraryVariable2, isArbitraryValue2]
      }],
      "text-alignment": [{
        text: ["left", "center", "right", "justify", "start", "end"]
      }],
      "placeholder-color": [{
        placeholder: scaleColor()
      }],
      "text-color": [{
        text: scaleColor()
      }],
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      "text-decoration-style": [{
        decoration: [...scaleLineStyle(), "wavy"]
      }],
      "text-decoration-thickness": [{
        decoration: [isNumber4, "from-font", "auto", isArbitraryVariable2, isArbitraryLength2]
      }],
      "text-decoration-color": [{
        decoration: scaleColor()
      }],
      "underline-offset": [{
        "underline-offset": [isNumber4, "auto", isArbitraryVariable2, isArbitraryValue2]
      }],
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      "text-wrap": [{
        text: ["wrap", "nowrap", "balance", "pretty"]
      }],
      indent: [{
        indent: scaleUnambiguousSpacing()
      }],
      "vertical-align": [{
        align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", isArbitraryVariable2, isArbitraryValue2]
      }],
      whitespace: [{
        whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"]
      }],
      break: [{
        break: ["normal", "words", "all", "keep"]
      }],
      wrap: [{
        wrap: ["break-word", "anywhere", "normal"]
      }],
      hyphens: [{
        hyphens: ["none", "manual", "auto"]
      }],
      content: [{
        content: ["none", isArbitraryVariable2, isArbitraryValue2]
      }],
      "bg-attachment": [{
        bg: ["fixed", "local", "scroll"]
      }],
      "bg-clip": [{
        "bg-clip": ["border", "padding", "content", "text"]
      }],
      "bg-origin": [{
        "bg-origin": ["border", "padding", "content"]
      }],
      "bg-position": [{
        bg: scaleBgPosition()
      }],
      "bg-repeat": [{
        bg: scaleBgRepeat()
      }],
      "bg-size": [{
        bg: scaleBgSize()
      }],
      "bg-image": [{
        bg: ["none", {
          linear: [{
            to: ["t", "tr", "r", "br", "b", "bl", "l", "tl"]
          }, isInteger2, isArbitraryVariable2, isArbitraryValue2],
          radial: ["", isArbitraryVariable2, isArbitraryValue2],
          conic: [isInteger2, isArbitraryVariable2, isArbitraryValue2]
        }, isArbitraryVariableImage2, isArbitraryImage2]
      }],
      "bg-color": [{
        bg: scaleColor()
      }],
      "gradient-from-pos": [{
        from: scaleGradientStopPosition()
      }],
      "gradient-via-pos": [{
        via: scaleGradientStopPosition()
      }],
      "gradient-to-pos": [{
        to: scaleGradientStopPosition()
      }],
      "gradient-from": [{
        from: scaleColor()
      }],
      "gradient-via": [{
        via: scaleColor()
      }],
      "gradient-to": [{
        to: scaleColor()
      }],
      rounded: [{
        rounded: scaleRadius()
      }],
      "rounded-s": [{
        "rounded-s": scaleRadius()
      }],
      "rounded-e": [{
        "rounded-e": scaleRadius()
      }],
      "rounded-t": [{
        "rounded-t": scaleRadius()
      }],
      "rounded-r": [{
        "rounded-r": scaleRadius()
      }],
      "rounded-b": [{
        "rounded-b": scaleRadius()
      }],
      "rounded-l": [{
        "rounded-l": scaleRadius()
      }],
      "rounded-ss": [{
        "rounded-ss": scaleRadius()
      }],
      "rounded-se": [{
        "rounded-se": scaleRadius()
      }],
      "rounded-ee": [{
        "rounded-ee": scaleRadius()
      }],
      "rounded-es": [{
        "rounded-es": scaleRadius()
      }],
      "rounded-tl": [{
        "rounded-tl": scaleRadius()
      }],
      "rounded-tr": [{
        "rounded-tr": scaleRadius()
      }],
      "rounded-br": [{
        "rounded-br": scaleRadius()
      }],
      "rounded-bl": [{
        "rounded-bl": scaleRadius()
      }],
      "border-w": [{
        border: scaleBorderWidth()
      }],
      "border-w-x": [{
        "border-x": scaleBorderWidth()
      }],
      "border-w-y": [{
        "border-y": scaleBorderWidth()
      }],
      "border-w-s": [{
        "border-s": scaleBorderWidth()
      }],
      "border-w-e": [{
        "border-e": scaleBorderWidth()
      }],
      "border-w-t": [{
        "border-t": scaleBorderWidth()
      }],
      "border-w-r": [{
        "border-r": scaleBorderWidth()
      }],
      "border-w-b": [{
        "border-b": scaleBorderWidth()
      }],
      "border-w-l": [{
        "border-l": scaleBorderWidth()
      }],
      "divide-x": [{
        "divide-x": scaleBorderWidth()
      }],
      "divide-x-reverse": ["divide-x-reverse"],
      "divide-y": [{
        "divide-y": scaleBorderWidth()
      }],
      "divide-y-reverse": ["divide-y-reverse"],
      "border-style": [{
        border: [...scaleLineStyle(), "hidden", "none"]
      }],
      "divide-style": [{
        divide: [...scaleLineStyle(), "hidden", "none"]
      }],
      "border-color": [{
        border: scaleColor()
      }],
      "border-color-x": [{
        "border-x": scaleColor()
      }],
      "border-color-y": [{
        "border-y": scaleColor()
      }],
      "border-color-s": [{
        "border-s": scaleColor()
      }],
      "border-color-e": [{
        "border-e": scaleColor()
      }],
      "border-color-t": [{
        "border-t": scaleColor()
      }],
      "border-color-r": [{
        "border-r": scaleColor()
      }],
      "border-color-b": [{
        "border-b": scaleColor()
      }],
      "border-color-l": [{
        "border-l": scaleColor()
      }],
      "divide-color": [{
        divide: scaleColor()
      }],
      "outline-style": [{
        outline: [...scaleLineStyle(), "none", "hidden"]
      }],
      "outline-offset": [{
        "outline-offset": [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "outline-w": [{
        outline: ["", isNumber4, isArbitraryVariableLength2, isArbitraryLength2]
      }],
      "outline-color": [{
        outline: scaleColor()
      }],
      shadow: [{
        shadow: [
          "",
          "none",
          themeShadow,
          isArbitraryVariableShadow2,
          isArbitraryShadow2
        ]
      }],
      "shadow-color": [{
        shadow: scaleColor()
      }],
      "inset-shadow": [{
        "inset-shadow": ["none", themeInsetShadow, isArbitraryVariableShadow2, isArbitraryShadow2]
      }],
      "inset-shadow-color": [{
        "inset-shadow": scaleColor()
      }],
      "ring-w": [{
        ring: scaleBorderWidth()
      }],
      "ring-w-inset": ["ring-inset"],
      "ring-color": [{
        ring: scaleColor()
      }],
      "ring-offset-w": [{
        "ring-offset": [isNumber4, isArbitraryLength2]
      }],
      "ring-offset-color": [{
        "ring-offset": scaleColor()
      }],
      "inset-ring-w": [{
        "inset-ring": scaleBorderWidth()
      }],
      "inset-ring-color": [{
        "inset-ring": scaleColor()
      }],
      "text-shadow": [{
        "text-shadow": ["none", themeTextShadow, isArbitraryVariableShadow2, isArbitraryShadow2]
      }],
      "text-shadow-color": [{
        "text-shadow": scaleColor()
      }],
      opacity: [{
        opacity: [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "mix-blend": [{
        "mix-blend": [...scaleBlendMode(), "plus-darker", "plus-lighter"]
      }],
      "bg-blend": [{
        "bg-blend": scaleBlendMode()
      }],
      "mask-clip": [{
        "mask-clip": ["border", "padding", "content", "fill", "stroke", "view"]
      }, "mask-no-clip"],
      "mask-composite": [{
        mask: ["add", "subtract", "intersect", "exclude"]
      }],
      "mask-image-linear-pos": [{
        "mask-linear": [isNumber4]
      }],
      "mask-image-linear-from-pos": [{
        "mask-linear-from": scaleMaskImagePosition()
      }],
      "mask-image-linear-to-pos": [{
        "mask-linear-to": scaleMaskImagePosition()
      }],
      "mask-image-linear-from-color": [{
        "mask-linear-from": scaleColor()
      }],
      "mask-image-linear-to-color": [{
        "mask-linear-to": scaleColor()
      }],
      "mask-image-t-from-pos": [{
        "mask-t-from": scaleMaskImagePosition()
      }],
      "mask-image-t-to-pos": [{
        "mask-t-to": scaleMaskImagePosition()
      }],
      "mask-image-t-from-color": [{
        "mask-t-from": scaleColor()
      }],
      "mask-image-t-to-color": [{
        "mask-t-to": scaleColor()
      }],
      "mask-image-r-from-pos": [{
        "mask-r-from": scaleMaskImagePosition()
      }],
      "mask-image-r-to-pos": [{
        "mask-r-to": scaleMaskImagePosition()
      }],
      "mask-image-r-from-color": [{
        "mask-r-from": scaleColor()
      }],
      "mask-image-r-to-color": [{
        "mask-r-to": scaleColor()
      }],
      "mask-image-b-from-pos": [{
        "mask-b-from": scaleMaskImagePosition()
      }],
      "mask-image-b-to-pos": [{
        "mask-b-to": scaleMaskImagePosition()
      }],
      "mask-image-b-from-color": [{
        "mask-b-from": scaleColor()
      }],
      "mask-image-b-to-color": [{
        "mask-b-to": scaleColor()
      }],
      "mask-image-l-from-pos": [{
        "mask-l-from": scaleMaskImagePosition()
      }],
      "mask-image-l-to-pos": [{
        "mask-l-to": scaleMaskImagePosition()
      }],
      "mask-image-l-from-color": [{
        "mask-l-from": scaleColor()
      }],
      "mask-image-l-to-color": [{
        "mask-l-to": scaleColor()
      }],
      "mask-image-x-from-pos": [{
        "mask-x-from": scaleMaskImagePosition()
      }],
      "mask-image-x-to-pos": [{
        "mask-x-to": scaleMaskImagePosition()
      }],
      "mask-image-x-from-color": [{
        "mask-x-from": scaleColor()
      }],
      "mask-image-x-to-color": [{
        "mask-x-to": scaleColor()
      }],
      "mask-image-y-from-pos": [{
        "mask-y-from": scaleMaskImagePosition()
      }],
      "mask-image-y-to-pos": [{
        "mask-y-to": scaleMaskImagePosition()
      }],
      "mask-image-y-from-color": [{
        "mask-y-from": scaleColor()
      }],
      "mask-image-y-to-color": [{
        "mask-y-to": scaleColor()
      }],
      "mask-image-radial": [{
        "mask-radial": [isArbitraryVariable2, isArbitraryValue2]
      }],
      "mask-image-radial-from-pos": [{
        "mask-radial-from": scaleMaskImagePosition()
      }],
      "mask-image-radial-to-pos": [{
        "mask-radial-to": scaleMaskImagePosition()
      }],
      "mask-image-radial-from-color": [{
        "mask-radial-from": scaleColor()
      }],
      "mask-image-radial-to-color": [{
        "mask-radial-to": scaleColor()
      }],
      "mask-image-radial-shape": [{
        "mask-radial": ["circle", "ellipse"]
      }],
      "mask-image-radial-size": [{
        "mask-radial": [{
          closest: ["side", "corner"],
          farthest: ["side", "corner"]
        }]
      }],
      "mask-image-radial-pos": [{
        "mask-radial-at": scalePosition()
      }],
      "mask-image-conic-pos": [{
        "mask-conic": [isNumber4]
      }],
      "mask-image-conic-from-pos": [{
        "mask-conic-from": scaleMaskImagePosition()
      }],
      "mask-image-conic-to-pos": [{
        "mask-conic-to": scaleMaskImagePosition()
      }],
      "mask-image-conic-from-color": [{
        "mask-conic-from": scaleColor()
      }],
      "mask-image-conic-to-color": [{
        "mask-conic-to": scaleColor()
      }],
      "mask-mode": [{
        mask: ["alpha", "luminance", "match"]
      }],
      "mask-origin": [{
        "mask-origin": ["border", "padding", "content", "fill", "stroke", "view"]
      }],
      "mask-position": [{
        mask: scaleBgPosition()
      }],
      "mask-repeat": [{
        mask: scaleBgRepeat()
      }],
      "mask-size": [{
        mask: scaleBgSize()
      }],
      "mask-type": [{
        "mask-type": ["alpha", "luminance"]
      }],
      "mask-image": [{
        mask: ["none", isArbitraryVariable2, isArbitraryValue2]
      }],
      filter: [{
        filter: [
          "",
          "none",
          isArbitraryVariable2,
          isArbitraryValue2
        ]
      }],
      blur: [{
        blur: scaleBlur()
      }],
      brightness: [{
        brightness: [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      contrast: [{
        contrast: [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "drop-shadow": [{
        "drop-shadow": [
          "",
          "none",
          themeDropShadow,
          isArbitraryVariableShadow2,
          isArbitraryShadow2
        ]
      }],
      "drop-shadow-color": [{
        "drop-shadow": scaleColor()
      }],
      grayscale: [{
        grayscale: ["", isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "hue-rotate": [{
        "hue-rotate": [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      invert: [{
        invert: ["", isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      saturate: [{
        saturate: [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      sepia: [{
        sepia: ["", isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "backdrop-filter": [{
        "backdrop-filter": [
          "",
          "none",
          isArbitraryVariable2,
          isArbitraryValue2
        ]
      }],
      "backdrop-blur": [{
        "backdrop-blur": scaleBlur()
      }],
      "backdrop-brightness": [{
        "backdrop-brightness": [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "backdrop-contrast": [{
        "backdrop-contrast": [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "backdrop-grayscale": [{
        "backdrop-grayscale": ["", isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "backdrop-hue-rotate": [{
        "backdrop-hue-rotate": [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "backdrop-invert": [{
        "backdrop-invert": ["", isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "backdrop-opacity": [{
        "backdrop-opacity": [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "backdrop-saturate": [{
        "backdrop-saturate": [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "backdrop-sepia": [{
        "backdrop-sepia": ["", isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      "border-collapse": [{
        border: ["collapse", "separate"]
      }],
      "border-spacing": [{
        "border-spacing": scaleUnambiguousSpacing()
      }],
      "border-spacing-x": [{
        "border-spacing-x": scaleUnambiguousSpacing()
      }],
      "border-spacing-y": [{
        "border-spacing-y": scaleUnambiguousSpacing()
      }],
      "table-layout": [{
        table: ["auto", "fixed"]
      }],
      caption: [{
        caption: ["top", "bottom"]
      }],
      transition: [{
        transition: ["", "all", "colors", "opacity", "shadow", "transform", "none", isArbitraryVariable2, isArbitraryValue2]
      }],
      "transition-behavior": [{
        transition: ["normal", "discrete"]
      }],
      duration: [{
        duration: [isNumber4, "initial", isArbitraryVariable2, isArbitraryValue2]
      }],
      ease: [{
        ease: ["linear", "initial", themeEase, isArbitraryVariable2, isArbitraryValue2]
      }],
      delay: [{
        delay: [isNumber4, isArbitraryVariable2, isArbitraryValue2]
      }],
      animate: [{
        animate: ["none", themeAnimate, isArbitraryVariable2, isArbitraryValue2]
      }],
      backface: [{
        backface: ["hidden", "visible"]
      }],
      perspective: [{
        perspective: [themePerspective, isArbitraryVariable2, isArbitraryValue2]
      }],
      "perspective-origin": [{
        "perspective-origin": scalePositionWithArbitrary()
      }],
      rotate: [{
        rotate: scaleRotate()
      }],
      "rotate-x": [{
        "rotate-x": scaleRotate()
      }],
      "rotate-y": [{
        "rotate-y": scaleRotate()
      }],
      "rotate-z": [{
        "rotate-z": scaleRotate()
      }],
      scale: [{
        scale: scaleScale()
      }],
      "scale-x": [{
        "scale-x": scaleScale()
      }],
      "scale-y": [{
        "scale-y": scaleScale()
      }],
      "scale-z": [{
        "scale-z": scaleScale()
      }],
      "scale-3d": ["scale-3d"],
      skew: [{
        skew: scaleSkew()
      }],
      "skew-x": [{
        "skew-x": scaleSkew()
      }],
      "skew-y": [{
        "skew-y": scaleSkew()
      }],
      transform: [{
        transform: [isArbitraryVariable2, isArbitraryValue2, "", "none", "gpu", "cpu"]
      }],
      "transform-origin": [{
        origin: scalePositionWithArbitrary()
      }],
      "transform-style": [{
        transform: ["3d", "flat"]
      }],
      translate: [{
        translate: scaleTranslate()
      }],
      "translate-x": [{
        "translate-x": scaleTranslate()
      }],
      "translate-y": [{
        "translate-y": scaleTranslate()
      }],
      "translate-z": [{
        "translate-z": scaleTranslate()
      }],
      "translate-none": ["translate-none"],
      accent: [{
        accent: scaleColor()
      }],
      appearance: [{
        appearance: ["none", "auto"]
      }],
      "caret-color": [{
        caret: scaleColor()
      }],
      "color-scheme": [{
        scheme: ["normal", "dark", "light", "light-dark", "only-dark", "only-light"]
      }],
      cursor: [{
        cursor: ["auto", "default", "pointer", "wait", "text", "move", "help", "not-allowed", "none", "context-menu", "progress", "cell", "crosshair", "vertical-text", "alias", "copy", "no-drop", "grab", "grabbing", "all-scroll", "col-resize", "row-resize", "n-resize", "e-resize", "s-resize", "w-resize", "ne-resize", "nw-resize", "se-resize", "sw-resize", "ew-resize", "ns-resize", "nesw-resize", "nwse-resize", "zoom-in", "zoom-out", isArbitraryVariable2, isArbitraryValue2]
      }],
      "field-sizing": [{
        "field-sizing": ["fixed", "content"]
      }],
      "pointer-events": [{
        "pointer-events": ["auto", "none"]
      }],
      resize: [{
        resize: ["none", "", "y", "x"]
      }],
      "scroll-behavior": [{
        scroll: ["auto", "smooth"]
      }],
      "scroll-m": [{
        "scroll-m": scaleUnambiguousSpacing()
      }],
      "scroll-mx": [{
        "scroll-mx": scaleUnambiguousSpacing()
      }],
      "scroll-my": [{
        "scroll-my": scaleUnambiguousSpacing()
      }],
      "scroll-ms": [{
        "scroll-ms": scaleUnambiguousSpacing()
      }],
      "scroll-me": [{
        "scroll-me": scaleUnambiguousSpacing()
      }],
      "scroll-mt": [{
        "scroll-mt": scaleUnambiguousSpacing()
      }],
      "scroll-mr": [{
        "scroll-mr": scaleUnambiguousSpacing()
      }],
      "scroll-mb": [{
        "scroll-mb": scaleUnambiguousSpacing()
      }],
      "scroll-ml": [{
        "scroll-ml": scaleUnambiguousSpacing()
      }],
      "scroll-p": [{
        "scroll-p": scaleUnambiguousSpacing()
      }],
      "scroll-px": [{
        "scroll-px": scaleUnambiguousSpacing()
      }],
      "scroll-py": [{
        "scroll-py": scaleUnambiguousSpacing()
      }],
      "scroll-ps": [{
        "scroll-ps": scaleUnambiguousSpacing()
      }],
      "scroll-pe": [{
        "scroll-pe": scaleUnambiguousSpacing()
      }],
      "scroll-pt": [{
        "scroll-pt": scaleUnambiguousSpacing()
      }],
      "scroll-pr": [{
        "scroll-pr": scaleUnambiguousSpacing()
      }],
      "scroll-pb": [{
        "scroll-pb": scaleUnambiguousSpacing()
      }],
      "scroll-pl": [{
        "scroll-pl": scaleUnambiguousSpacing()
      }],
      "snap-align": [{
        snap: ["start", "end", "center", "align-none"]
      }],
      "snap-stop": [{
        snap: ["normal", "always"]
      }],
      "snap-type": [{
        snap: ["none", "x", "y", "both"]
      }],
      "snap-strictness": [{
        snap: ["mandatory", "proximity"]
      }],
      touch: [{
        touch: ["auto", "none", "manipulation"]
      }],
      "touch-x": [{
        "touch-pan": ["x", "left", "right"]
      }],
      "touch-y": [{
        "touch-pan": ["y", "up", "down"]
      }],
      "touch-pz": ["touch-pinch-zoom"],
      select: [{
        select: ["none", "text", "all", "auto"]
      }],
      "will-change": [{
        "will-change": ["auto", "scroll", "contents", "transform", isArbitraryVariable2, isArbitraryValue2]
      }],
      fill: [{
        fill: ["none", ...scaleColor()]
      }],
      "stroke-w": [{
        stroke: [isNumber4, isArbitraryVariableLength2, isArbitraryLength2, isArbitraryNumber2]
      }],
      stroke: [{
        stroke: ["none", ...scaleColor()]
      }],
      "forced-color-adjust": [{
        "forced-color-adjust": ["auto", "none"]
      }]
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-x", "border-w-y", "border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-x", "border-color-y", "border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      translate: ["translate-x", "translate-y", "translate-none"],
      "translate-none": ["translate", "translate-x", "translate-y", "translate-z"],
      "scroll-m": ["scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": ["scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"]
    },
    conflictingClassGroupModifiers: {
      "font-size": ["leading"]
    },
    orderSensitiveModifiers: ["*", "**", "after", "backdrop", "before", "details-content", "file", "first-letter", "first-line", "marker", "placeholder", "selection"]
  };
};
var twMerge2 = /* @__PURE__ */ createTailwindMerge2(getDefaultConfig2);

// ../blazecn/src/utils.ts
function cn2(...inputs) {
  return twMerge2(clsx2(inputs));
}

// ../blazecn/src/Separator.tsx
function Separator({ className, orientation = "horizontal" }) {
  return createElement2("div", {
    "data-slot": "separator",
    role: "separator",
    className: cn2("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)
  });
}

// src/client/components/NetworkList.tsx
function Orb({ pill, onClick, title, children }) {
  const pillH = pill === "full" ? "h-8" : pill === "dot" ? "h-2" : "h-0 group-hover:h-4";
  return createElement("div", {
    className: "relative w-14 h-14 flex-shrink-0 flex items-center justify-center group cursor-pointer",
    onClick,
    title
  }, createElement("div", {
    className: cn("absolute left-0 w-1 rounded-r-full bg-foreground transition-all duration-200", pillH)
  }), children);
}
function OrbIcon({ active, className, children }) {
  return createElement("div", {
    className: cn("size-[42px] rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200", active ? "rounded-2xl" : "hover:rounded-2xl", className)
  }, children);
}
function Badge({ count, color }) {
  if (count <= 0)
    return null;
  return createElement("div", {
    className: cn("absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1", color || "bg-primary")
  }, count > 99 ? "99+" : String(count));
}
function SectionLabel({ text }) {
  return createElement("div", {
    className: "w-full text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 text-center mt-1 mb-0.5 select-none"
  }, text);
}
function NetworkList() {
  const state = store.getState();
  const p2p = p2pStore.getState();
  const isHome = state.appMode === "home";
  const isIrc = state.appMode === "irc";
  const isP2P = state.appMode === "p2p";
  const profile = state.nostrPubkey ? nostr.getProfile(state.nostrPubkey) : null;
  const displayName = profile?.displayName || profile?.name || null;
  return createElement("div", {
    className: "flex flex-col w-[72px] flex-shrink-0 bg-background border-r border-border/30"
  }, createElement("div", {
    className: "flex flex-col items-center flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-3 pb-3 gap-1"
  }, createElement(Orb, {
    pill: isHome ? "full" : "hover",
    onClick: () => store.setAppMode("home"),
    title: displayName ? `${displayName} — Home` : "Home"
  }, profile?.picture ? createElement("img", {
    src: profile.picture,
    className: cn("size-[42px] rounded-full object-cover transition-all duration-200", isHome ? "rounded-2xl ring-2 ring-primary" : "hover:rounded-2xl"),
    onError: (e) => {
      e.target.style.display = "none";
    }
  }) : createElement(OrbIcon, {
    active: isHome,
    className: isHome ? "bg-primary text-primary-foreground" : "bg-surface-variant text-on-surface-variant hover:bg-primary/80 hover:text-primary-foreground"
  }, state.nostrPubkey ? displayName ? displayName.charAt(0).toUpperCase() : "?" : createElement("span", { className: "material-symbols-rounded text-lg" }, "person")), state.nostrPubkey ? createElement("div", {
    className: "absolute bottom-1 right-1 size-3 rounded-full border-2 border-background bg-online"
  }) : null), createElement(Orb, {
    pill: isP2P && !p2p.roomId ? "full" : isP2P ? "dot" : "hover",
    onClick: () => store.setAppMode("p2p"),
    title: "P2P Chat"
  }, createElement(OrbIcon, {
    active: isP2P,
    className: cn(isP2P ? "bg-online text-white" : "bg-surface-variant text-on-surface-variant hover:bg-online/80 hover:text-white")
  }, createElement("span", { className: "material-symbols-rounded text-xl" }, "hub")), p2p.roomId && p2p.peerList.length > 0 ? createElement(Badge, { count: p2p.peerList.length, color: "bg-online" }) : null), createElement(Separator, { className: "w-8 my-1 flex-shrink-0 mx-auto" }), state.networks.length > 0 ? createElement(SectionLabel, { text: "IRC" }) : null, ...state.networks.map((network) => {
    const isActive = isIrc && network.id === state.activeNetworkId;
    const totalUnread = network.channels.reduce((sum, ch) => sum + ch.unread, 0);
    const totalHighlight = network.channels.reduce((sum, ch) => sum + ch.highlight, 0);
    const initial = network.name.charAt(0).toUpperCase();
    return createElement(Orb, {
      key: network.id,
      pill: isActive ? "full" : totalUnread > 0 ? "dot" : "hover",
      title: `${network.name} (${network.host})`,
      onClick: () => {
        if (!isIrc)
          store.setAppMode("irc");
        if (isActive && state.sidebarOpen) {
          store.toggleSidebar();
        } else {
          const firstChan = network.channels[0];
          if (firstChan)
            store.setActiveChannel(network.id, firstChan.name);
          if (!state.sidebarOpen)
            store.toggleSidebar();
        }
      }
    }, createElement(OrbIcon, {
      active: isActive,
      className: cn(isActive ? "bg-primary text-primary-foreground" : "bg-surface-variant text-on-surface-variant hover:bg-primary/80 hover:text-primary-foreground", !network.connected && "opacity-50")
    }, initial), createElement("div", {
      className: cn("absolute bottom-1 right-1 size-3 rounded-full border-2 border-background", network.connected ? "bg-online" : "bg-destructive")
    }), totalHighlight > 0 ? createElement(Badge, { count: totalHighlight, color: "bg-destructive" }) : createElement(Badge, { count: totalUnread }));
  }), createElement(Orb, {
    pill: "hover",
    onClick: () => {
      if (!isIrc)
        store.setAppMode("irc");
      store.openConnectForm();
    },
    title: "Add IRC server"
  }, createElement(OrbIcon, {
    className: "bg-surface-variant text-online hover:bg-online hover:text-white"
  }, createElement("span", { className: "material-symbols-rounded text-xl" }, "add"))), p2p.joinedRooms.length > 0 ? createElement(Separator, { className: "w-8 my-1 flex-shrink-0 mx-auto" }) : null, p2p.joinedRooms.length > 0 ? createElement(SectionLabel, { text: "Rooms" }) : null, ...p2p.joinedRooms.map((room) => {
    const isActive = isP2P && p2p.roomId === room.name;
    const initial = room.name.charAt(0).toUpperCase();
    return createElement(Orb, {
      key: room.id,
      pill: isActive ? "full" : "hover",
      title: room.name + (room.isPrivate ? " (private)" : ""),
      onClick: () => {
        if (!isP2P)
          store.setAppMode("p2p");
        p2pStore.setActiveRoom(room.name);
      }
    }, createElement(OrbIcon, {
      active: isActive,
      className: isActive ? "bg-online text-white" : "bg-surface-variant text-on-surface-variant hover:bg-online/80 hover:text-white"
    }, room.isPrivate ? createElement("span", { className: "material-symbols-rounded text-lg" }, "lock") : initial), isActive && p2p.peerList.length > 0 ? createElement(Badge, { count: p2p.peerList.length, color: "bg-online" }) : null);
  })), createElement(Separator, { className: "w-8 mx-auto" }), createElement("div", {
    className: "flex flex-col items-center py-2"
  }, createElement(Orb, {
    pill: state.settingsOpen ? "full" : "hover",
    onClick: () => state.settingsOpen ? store.closeSettings() : store.openSettings(),
    title: "Settings"
  }, createElement(OrbIcon, {
    active: state.settingsOpen,
    className: state.settingsOpen ? "bg-primary text-primary-foreground" : "bg-surface-variant text-on-surface-variant hover:bg-surface-variant hover:text-foreground"
  }, createElement("span", { className: "material-symbols-rounded text-xl" }, "settings")))));
}

// ../blazecn/node_modules/class-variance-authority/dist/index.mjs
var falsyToString = (value) => typeof value === "boolean" ? `${value}` : value === 0 ? "0" : value;
var cx = clsx2;
var cva = (base, config) => (props) => {
  var _config_compoundVariants;
  if ((config === null || config === undefined ? undefined : config.variants) == null)
    return cx(base, props === null || props === undefined ? undefined : props.class, props === null || props === undefined ? undefined : props.className);
  const { variants, defaultVariants } = config;
  const getVariantClassNames = Object.keys(variants).map((variant) => {
    const variantProp = props === null || props === undefined ? undefined : props[variant];
    const defaultVariantProp = defaultVariants === null || defaultVariants === undefined ? undefined : defaultVariants[variant];
    if (variantProp === null)
      return null;
    const variantKey = falsyToString(variantProp) || falsyToString(defaultVariantProp);
    return variants[variant][variantKey];
  });
  const propsWithoutUndefined = props && Object.entries(props).reduce((acc, param) => {
    let [key, value] = param;
    if (value === undefined) {
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
  const getCompoundVariantClassNames = config === null || config === undefined ? undefined : (_config_compoundVariants = config.compoundVariants) === null || _config_compoundVariants === undefined ? undefined : _config_compoundVariants.reduce((acc, param) => {
    let { class: cvClass, className: cvClassName, ...compoundVariantOptions } = param;
    return Object.entries(compoundVariantOptions).every((param2) => {
      let [key, value] = param2;
      return Array.isArray(value) ? value.includes({
        ...defaultVariants,
        ...propsWithoutUndefined
      }[key]) : {
        ...defaultVariants,
        ...propsWithoutUndefined
      }[key] === value;
    }) ? [
      ...acc,
      cvClass,
      cvClassName
    ] : acc;
  }, []);
  return cx(base, getVariantClassNames, getCompoundVariantClassNames, props === null || props === undefined ? undefined : props.class, props === null || props === undefined ? undefined : props.className);
};

// ../blazecn/src/Button.tsx
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=size-])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
      outline: "border-2 border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline"
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md gap-1.5 px-3",
      xs: "h-6 gap-1 rounded-md px-2 text-xs",
      lg: "h-10 rounded-md px-6",
      icon: "size-9",
      "icon-sm": "size-8"
    }
  },
  defaultVariants: {
    variant: "default",
    size: "default"
  }
});
function Button(props) {
  const {
    variant,
    size,
    className,
    disabled,
    type = "button",
    onClick,
    children
  } = props;
  return createElement2("button", {
    type,
    disabled,
    onClick,
    className: cn2(buttonVariants({ variant, size, className }))
  }, children);
}

// src/client/components/ChannelSidebar.tsx
function ChannelSidebar() {
  const state = store.getState();
  const network = store.getActiveNetwork();
  if (!network)
    return null;
  const channels = network.channels.filter((c) => c.type === "channel");
  const queries = network.channels.filter((c) => c.type === "query");
  const lobby = network.channels.find((c) => c.type === "lobby");
  return createElement("div", {
    className: "flex flex-col flex-shrink-0 bg-surface-high overflow-hidden",
    style: { width: `${state.sidebarWidth}px` }
  }, createElement("div", {
    className: "flex items-center h-12 px-4 flex-shrink-0 border-b border-border"
  }, createElement("div", {
    className: cn("size-2 rounded-full mr-2 flex-shrink-0", network.connected ? "bg-online" : "bg-destructive")
  }), createElement("h2", {
    className: "text-sm font-semibold text-on-surface truncate flex-1"
  }, network.name), createElement(Button, {
    variant: "ghost",
    size: "icon-sm",
    className: "size-7 text-muted-foreground hover:text-destructive",
    onClick: () => store.disconnect(network.id)
  }, createElement("span", { className: "material-symbols-rounded text-base" }, "power_settings_new"))), createElement("div", {
    className: "flex-1 overflow-y-auto py-1 pb-28"
  }, lobby ? createElement("a", {
    className: cn("flex items-center gap-2 px-2 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors duration-100", state.activeChannelName === lobby.name && state.activeNetworkId === network.id ? "bg-accent text-accent-foreground" : "text-on-surface-variant hover:bg-accent/50 hover:text-accent-foreground"),
    onClick: () => store.setActiveChannel(network.id, lobby.name)
  }, createElement("span", {
    className: "material-symbols-rounded text-lg flex-shrink-0"
  }, "dns"), createElement("span", { className: "truncate text-sm flex-1" }, network.name)) : null, channels.length > 0 ? createElement("div", {
    className: "flex items-center gap-1 px-4 pt-4 pb-1"
  }, createElement("span", {
    className: "text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
  }, "Channels"), createElement(Button, {
    variant: "ghost",
    size: "icon-sm",
    className: "ml-auto size-5 text-muted-foreground hover:text-foreground",
    onClick: () => {
      const channel = prompt("Join channel:");
      if (channel)
        store.joinChannel(channel.startsWith("#") ? channel : "#" + channel);
    }
  }, createElement("span", { className: "material-symbols-rounded text-sm" }, "add"))) : null, ...channels.map((channel) => {
    const isActive = state.activeChannelName === channel.name && state.activeNetworkId === network.id;
    return createElement("a", {
      key: channel.name,
      className: cn("flex items-center gap-2 px-2 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors duration-100", isActive ? "bg-accent text-accent-foreground" : "text-on-surface-variant hover:bg-accent/50 hover:text-accent-foreground", channel.unread > 0 && !isActive && "text-on-surface font-semibold"),
      onClick: () => store.setActiveChannel(network.id, channel.name)
    }, createElement("span", {
      className: "material-symbols-rounded text-lg flex-shrink-0 text-on-surface-variant"
    }, "tag"), createElement("span", { className: "truncate text-sm flex-1" }, channel.name.replace(/^#/, "")), channel.highlight > 0 ? createElement("span", {
      className: "min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0"
    }, String(channel.highlight)) : channel.unread > 0 && !isActive ? createElement("span", {
      className: "size-2 rounded-full bg-foreground flex-shrink-0"
    }) : null);
  }), queries.length > 0 ? createElement("div", {
    className: "flex items-center gap-1 px-4 pt-4 pb-1"
  }, createElement("span", {
    className: "text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
  }, "Direct Messages")) : null, ...queries.map((channel) => {
    const isActive = state.activeChannelName === channel.name && state.activeNetworkId === network.id;
    return createElement("a", {
      key: channel.name,
      className: cn("flex items-center gap-2 px-2 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors duration-100", isActive ? "bg-accent text-accent-foreground" : "text-on-surface-variant hover:bg-accent/50 hover:text-accent-foreground", channel.unread > 0 && !isActive && "text-on-surface font-semibold"),
      onClick: () => store.setActiveChannel(network.id, channel.name)
    }, createElement("span", {
      className: "material-symbols-rounded text-lg flex-shrink-0 text-on-surface-variant"
    }, "person"), createElement("span", { className: "truncate text-sm flex-1" }, channel.name), channel.unread > 0 && !isActive ? createElement("span", {
      className: "min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0"
    }, String(channel.unread)) : null);
  })), createElement("div", { className: "px-3 py-2 border-t border-border" }, createElement(Button, {
    variant: "ghost",
    className: "w-full justify-start gap-2 text-muted-foreground hover:text-foreground",
    onClick: () => {
      const channel = prompt("Join channel:");
      if (channel)
        store.joinChannel(channel.startsWith("#") ? channel : "#" + channel);
    }
  }, createElement("span", { className: "material-symbols-rounded text-lg" }, "add"), "Join channel")));
}

// src/client/helpers/ircparser/parseStyle.ts
var BOLD = "\x02";
var COLOR = "\x03";
var HEX_COLOR = "\x04";
var RESET = "\x0F";
var REVERSE = "\x16";
var ITALIC = "\x1D";
var UNDERLINE = "\x1F";
var STRIKETHROUGH = "\x1E";
var MONOSPACE = "\x11";
var colorRx = /^(\d{1,2})(?:,(\d{1,2}))?/;
var hexColorRx = /^([0-9a-f]{6})(?:,([0-9a-f]{6}))?/i;
var controlCodesRx = /[\u0000-\u0009\u000B-\u001F]/g;
function parseStyle(text) {
  const result3 = [];
  let start = 0;
  let position = 0;
  let colorCodes, bold, textColor, bgColor, hexColor, hexBgColor, italic, underline, strikethrough, monospace;
  const resetStyle = () => {
    bold = false;
    textColor = undefined;
    bgColor = undefined;
    hexColor = undefined;
    hexBgColor = undefined;
    italic = false;
    underline = false;
    strikethrough = false;
    monospace = false;
  };
  resetStyle();
  const emitFragment = () => {
    const textPart = text.slice(start, position);
    const processedText = textPart.replace(controlCodesRx, " ");
    if (processedText.length) {
      const fragmentStart = result3.length ? result3[result3.length - 1].end : 0;
      result3.push({
        bold,
        textColor,
        bgColor,
        hexColor,
        hexBgColor,
        italic,
        underline,
        strikethrough,
        monospace,
        text: processedText,
        start: fragmentStart,
        end: fragmentStart + processedText.length
      });
    }
    start = position + 1;
  };
  while (position < text.length) {
    switch (text[position]) {
      case RESET:
        emitFragment();
        resetStyle();
        break;
      case BOLD:
        emitFragment();
        bold = !bold;
        break;
      case COLOR:
        emitFragment();
        colorCodes = text.slice(position + 1).match(colorRx);
        if (colorCodes) {
          textColor = Number(colorCodes[1]);
          if (colorCodes[2])
            bgColor = Number(colorCodes[2]);
          position += colorCodes[0].length;
          start = position + 1;
        } else {
          textColor = undefined;
          bgColor = undefined;
        }
        break;
      case HEX_COLOR:
        emitFragment();
        colorCodes = text.slice(position + 1).match(hexColorRx);
        if (colorCodes) {
          hexColor = colorCodes[1].toUpperCase();
          if (colorCodes[2])
            hexBgColor = colorCodes[2].toUpperCase();
          position += colorCodes[0].length;
          start = position + 1;
        } else {
          hexColor = undefined;
          hexBgColor = undefined;
        }
        break;
      case REVERSE: {
        emitFragment();
        const tmp = bgColor;
        bgColor = textColor;
        textColor = tmp;
        break;
      }
      case ITALIC:
        emitFragment();
        italic = !italic;
        break;
      case UNDERLINE:
        emitFragment();
        underline = !underline;
        break;
      case STRIKETHROUGH:
        emitFragment();
        strikethrough = !strikethrough;
        break;
      case MONOSPACE:
        emitFragment();
        monospace = !monospace;
        break;
    }
    position += 1;
  }
  emitFragment();
  const properties = [
    "bold",
    "textColor",
    "bgColor",
    "hexColor",
    "hexBgColor",
    "italic",
    "underline",
    "strikethrough",
    "monospace"
  ];
  return result3.reduce((prev, curr) => {
    if (prev.length) {
      const last = prev[prev.length - 1];
      if (properties.every((key) => curr[key] === last[key])) {
        last.text += curr.text;
        last.end += curr.text.length;
        return prev;
      }
    }
    return prev.concat([curr]);
  }, []);
}
var parseStyle_default = parseStyle;

// src/client/helpers/ircparser/findChannels.ts
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function escapeRegExpCharSet(raw) {
  return escapeRegExp(raw).replace("-", "\\-");
}
function findChannels(text, channelPrefixes = ["#", "&"], userModes = ["@", "+", "%", "~", "&"]) {
  const userModePattern = userModes.map(escapeRegExpCharSet).join("");
  const channelPrefixPattern = channelPrefixes.map(escapeRegExpCharSet).join("");
  const channelPattern = `(?:^|\\s)[${userModePattern}]*([${channelPrefixPattern}][^ \\u0007]+)`;
  const channelRegExp = new RegExp(channelPattern, "g");
  const result3 = [];
  let match;
  while (match = channelRegExp.exec(text)) {
    result3.push({
      start: match.index + match[0].length - match[1].length,
      end: match.index + match[0].length,
      channel: match[1]
    });
  }
  return result3;
}

// src/client/helpers/ircparser/findLinks.ts
var urlRegex = /(?:https?:\/\/|ftp:\/\/|ircs?:\/\/|ssh:\/\/|magnet:\?|www\.)[^\s<>"\u0000-\u001f]+/gi;
function findLinks(text) {
  const result3 = [];
  let match;
  urlRegex.lastIndex = 0;
  while (match = urlRegex.exec(text)) {
    let link = match[0];
    while (/[.,;:!?)>\]}'"]$/.test(link)) {
      if (link.endsWith(")") && (link.match(/\(/g) || []).length >= (link.match(/\)/g) || []).length) {
        break;
      }
      link = link.slice(0, -1);
    }
    const href = link.startsWith("www.") ? "http://" + link : link;
    result3.push({
      start: match.index,
      end: match.index + link.length,
      link: href
    });
  }
  return result3;
}

// src/client/helpers/ircparser/findNames.ts
var nickRegExp = /([\w[\]\\`^{|}-]+)/g;
function findNames(text, nicks) {
  const result3 = [];
  if (nicks.length === 0)
    return result3;
  let match;
  nickRegExp.lastIndex = 0;
  while (match = nickRegExp.exec(text)) {
    if (nicks.indexOf(match[1]) > -1) {
      result3.push({
        start: match.index,
        end: match.index + match[1].length,
        nick: match[1]
      });
    }
  }
  return result3;
}

// src/client/helpers/ircparser/merge.ts
function anyIntersection(a, b) {
  return a.start <= b.start && b.start < a.end || a.start < b.end && b.end <= a.end || b.start <= a.start && a.start < b.end || b.start < a.end && a.end <= b.end;
}
function fill(existingEntries, textLength) {
  let position = 0;
  const result3 = existingEntries.reduce((acc, seg) => {
    if (seg.start > position) {
      acc.push({ start: position, end: seg.start });
    }
    position = seg.end;
    return acc;
  }, []);
  if (position < textLength) {
    result3.push({ start: position, end: textLength });
  }
  return result3;
}
function assign(textPart, fragment) {
  const fragStart = fragment.start;
  const start = Math.max(fragment.start, textPart.start);
  const end = Math.min(fragment.end, textPart.end);
  const text = fragment.text.slice(start - fragStart, end - fragStart);
  return { ...fragment, start, end, text };
}
function sortParts(a, b) {
  return a.start - b.start || b.end - a.end;
}
function merge(parts, styleFragments, cleanText) {
  const deduped = parts.sort(sortParts).reduce((prev, curr) => {
    if (prev.some((p3) => anyIntersection(p3, curr)))
      return prev;
    return prev.concat([curr]);
  }, []);
  const filled = fill(deduped, cleanText.length);
  const allParts = [...deduped, ...filled].sort(sortParts);
  return allParts.map((part) => {
    const merged = {
      start: part.start,
      end: part.end,
      fragments: styleFragments.filter((frag) => anyIntersection(part, frag)).map((frag) => assign(part, frag))
    };
    if (part.link)
      merged.link = part.link;
    if (part.channel)
      merged.channel = part.channel;
    if (part.nick)
      merged.nick = part.nick;
    return merged;
  });
}

// src/client/helpers/ircparser/index.ts
function parseMessage(text, users = [], channelPrefixes = ["#", "&"]) {
  const styleFragments = parseStyle_default(text);
  const cleanText = styleFragments.map((f) => f.text).join("");
  const channelParts = findChannels(cleanText, channelPrefixes);
  const linkParts = findLinks(cleanText);
  const nameParts = findNames(cleanText, users);
  const parts = [
    ...channelParts,
    ...linkParts,
    ...nameParts
  ];
  return merge(parts, styleFragments, cleanText);
}

// src/client/helpers/colorClass.ts
function colorClass(str) {
  let hash = 0;
  for (let i = 0;i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  return "color-" + (1 + hash % 32).toString();
}
var nickColors = {
  "color-1": "hsl(0, 70%, 65%)",
  "color-2": "hsl(11, 70%, 65%)",
  "color-3": "hsl(22, 70%, 65%)",
  "color-4": "hsl(33, 70%, 65%)",
  "color-5": "hsl(45, 70%, 65%)",
  "color-6": "hsl(56, 70%, 65%)",
  "color-7": "hsl(67, 70%, 65%)",
  "color-8": "hsl(78, 70%, 65%)",
  "color-9": "hsl(90, 70%, 65%)",
  "color-10": "hsl(101, 70%, 65%)",
  "color-11": "hsl(112, 70%, 65%)",
  "color-12": "hsl(124, 70%, 65%)",
  "color-13": "hsl(135, 70%, 65%)",
  "color-14": "hsl(146, 70%, 65%)",
  "color-15": "hsl(157, 70%, 65%)",
  "color-16": "hsl(169, 70%, 65%)",
  "color-17": "hsl(180, 70%, 65%)",
  "color-18": "hsl(191, 70%, 65%)",
  "color-19": "hsl(202, 70%, 65%)",
  "color-20": "hsl(214, 70%, 65%)",
  "color-21": "hsl(225, 70%, 65%)",
  "color-22": "hsl(236, 70%, 65%)",
  "color-23": "hsl(247, 70%, 65%)",
  "color-24": "hsl(259, 70%, 65%)",
  "color-25": "hsl(270, 70%, 65%)",
  "color-26": "hsl(281, 70%, 65%)",
  "color-27": "hsl(292, 70%, 65%)",
  "color-28": "hsl(304, 70%, 65%)",
  "color-29": "hsl(315, 70%, 65%)",
  "color-30": "hsl(326, 70%, 65%)",
  "color-31": "hsl(337, 70%, 65%)",
  "color-32": "hsl(349, 70%, 65%)"
};
function nickColor(nick) {
  return nickColors[colorClass(nick)] || "hsl(0, 0%, 65%)";
}

// src/client/helpers/format.ts
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString())
    return "Today";
  if (d.toDateString() === yesterday.toDateString())
    return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

// src/client/components/ChatArea.tsx
function shouldGroup(msg, prev) {
  if (!prev)
    return false;
  if (prev.from !== msg.from)
    return false;
  if (msg.type !== "message" && msg.type !== "action")
    return false;
  if (prev.type !== "message" && prev.type !== "action")
    return false;
  if (msg.time - prev.time > 5 * 60000)
    return false;
  return true;
}
function isSystemMessage2(type) {
  return ["join", "part", "quit", "nick", "topic", "mode", "kick", "error", "motd", "whois", "lifecycle"].includes(type);
}
function isDifferentDay(a, b) {
  return new Date(a).toDateString() !== new Date(b).toDateString();
}
function DateSeparator({ ts }) {
  return createElement("div", {
    className: "flex items-center gap-3 px-4 py-2 my-1"
  }, createElement("div", { className: "flex-1 h-px bg-border" }), createElement("span", {
    className: "text-[11px] font-medium text-muted-foreground px-2"
  }, formatDate(ts)), createElement("div", { className: "flex-1 h-px bg-border" }));
}
var ircColors = {
  0: "#fff",
  1: "#000",
  2: "#00007f",
  3: "#009300",
  4: "#ff0000",
  5: "#7f0000",
  6: "#9c009c",
  7: "#fc7f00",
  8: "#ffff00",
  9: "#00fc00",
  10: "#009393",
  11: "#00ffff",
  12: "#0000fc",
  13: "#ff00ff",
  14: "#7f7f7f",
  15: "#d2d2d2"
};
function renderParsedText(text, users = []) {
  const parts = parseMessage(text, users);
  return parts.map((part, pi) => {
    const fragments = part.fragments.map((frag, fi) => {
      const classes = [];
      const style = {};
      if (frag.bold)
        classes.push("font-bold");
      if (frag.italic)
        classes.push("italic");
      if (frag.underline)
        classes.push("underline");
      if (frag.strikethrough)
        classes.push("line-through");
      if (frag.monospace)
        classes.push("font-mono bg-surface-variant/60 px-1 rounded text-[0.85em]");
      if (frag.textColor !== undefined && ircColors[frag.textColor]) {
        style.color = ircColors[frag.textColor];
      }
      if (frag.bgColor !== undefined && ircColors[frag.bgColor]) {
        style.backgroundColor = ircColors[frag.bgColor];
      }
      if (frag.hexColor)
        style.color = `#${frag.hexColor}`;
      if (frag.hexBgColor)
        style.backgroundColor = `#${frag.hexBgColor}`;
      if (classes.length > 0 || Object.keys(style).length > 0) {
        return createElement("span", {
          key: `f${pi}_${fi}`,
          className: classes.join(" ") || undefined,
          style: Object.keys(style).length > 0 ? style : undefined
        }, frag.text);
      }
      return frag.text;
    });
    if (part.link) {
      return createElement("a", {
        key: `p${pi}`,
        href: part.link,
        target: "_blank",
        rel: "noopener",
        className: "text-primary hover:underline break-all"
      }, fragments);
    }
    if (part.channel) {
      return createElement("span", {
        key: `p${pi}`,
        className: "text-primary cursor-pointer hover:underline",
        onClick: () => {
          const net = store.getActiveNetwork();
          if (net) {
            const existing = net.channels.find((c) => c.name === part.channel);
            if (existing) {
              store.setActiveChannel(net.id, part.channel);
            } else {
              store.joinChannel(part.channel);
            }
          }
        }
      }, fragments);
    }
    if (part.nick) {
      return createElement("span", {
        key: `p${pi}`,
        className: "font-semibold cursor-pointer hover:underline",
        style: { color: nickColor(part.nick) }
      }, fragments);
    }
    return fragments;
  });
}
function NickAvatar({ nick }) {
  return createElement("div", {
    className: "size-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-semibold flex-shrink-0",
    style: { color: nickColor(nick) }
  }, nick.charAt(0).toUpperCase());
}
function MessageItem({ msg, grouped }) {
  const channel = store.getActiveChannel();
  const users = channel?.users ? Object.keys(channel.users) : [];
  if (msg.type === "whois") {
    return createElement("div", {
      className: "mx-4 my-2 px-3 py-2 rounded-lg bg-surface-variant/40 border border-border"
    }, createElement("pre", {
      className: "text-xs text-on-surface whitespace-pre-wrap font-mono leading-relaxed"
    }, msg.text));
  }
  if (msg.type === "lifecycle") {
    return createElement("div", {
      className: "flex items-center gap-2 px-4 py-0.5"
    }, createElement("span", {
      className: "text-[11px] text-muted-foreground flex-shrink-0"
    }, formatTime(msg.time)), createElement("span", {
      className: "text-xs text-primary/70"
    }, createElement("span", { className: "mr-1" }, "●"), msg.text));
  }
  if (isSystemMessage2(msg.type)) {
    return createElement("div", {
      className: "flex items-center gap-2 px-4 py-0.5"
    }, createElement("span", {
      className: "text-[11px] text-muted-foreground flex-shrink-0"
    }, formatTime(msg.time)), createElement("span", {
      className: cn("text-xs italic", msg.type === "error" ? "text-destructive" : "text-muted-foreground")
    }, msg.type === "join" ? createElement("span", null, createElement("span", { className: "text-online" }, "→ "), ...renderParsedText(msg.text, users)) : msg.type === "part" || msg.type === "quit" ? createElement("span", null, createElement("span", { className: "text-destructive" }, "← "), ...renderParsedText(msg.text, users)) : msg.type === "motd" ? createElement("pre", {
      className: "text-xs text-muted-foreground whitespace-pre-wrap font-mono"
    }, msg.text) : createElement("span", null, ...renderParsedText(msg.text, users))));
  }
  if (msg.type === "notice") {
    return createElement("div", {
      className: "flex gap-2 px-4 py-0.5"
    }, createElement("span", {
      className: "text-[11px] text-muted-foreground flex-shrink-0 w-10 text-right"
    }, formatTime(msg.time)), createElement("span", {
      className: "text-sm text-primary/80"
    }, msg.from ? createElement("span", { className: "font-semibold" }, `-${msg.from}- `) : null, ...renderParsedText(msg.text, users)));
  }
  if (msg.type === "action") {
    return createElement("div", {
      className: "flex gap-2 px-4 py-0.5"
    }, createElement("span", {
      className: "text-[11px] text-muted-foreground flex-shrink-0 w-10 text-right"
    }, formatTime(msg.time)), createElement("span", {
      className: "text-sm italic text-on-surface/80"
    }, createElement("span", {
      className: "font-semibold",
      style: msg.from ? { color: nickColor(msg.from) } : undefined
    }, `* ${msg.from} `), ...renderParsedText(msg.text, users)));
  }
  if (grouped) {
    return createElement("div", {
      className: cn("group flex gap-2 px-4 py-0.5 hover:bg-accent/10 transition-colors", msg.highlight && "bg-destructive/10 border-l-2 border-destructive")
    }, createElement("span", {
      className: "text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-10 text-right"
    }, formatTime(msg.time)), createElement("div", { className: "size-8 flex-shrink-0" }), createElement("p", {
      className: "text-sm text-on-surface leading-relaxed break-words min-w-0 flex-1"
    }, ...renderParsedText(msg.text, users)));
  }
  return createElement("div", {
    className: cn("group flex gap-2 px-4 pt-2 pb-0.5 hover:bg-accent/10 transition-colors", msg.highlight && "bg-destructive/10 border-l-2 border-destructive")
  }, createElement("span", {
    className: "text-[11px] text-muted-foreground flex-shrink-0 w-10 text-right pt-0.5"
  }, formatTime(msg.time)), createElement(NickAvatar, { nick: msg.from || "?" }), createElement("div", { className: "flex-1 min-w-0" }, createElement("span", {
    className: cn("text-sm font-semibold cursor-pointer hover:underline"),
    style: msg.self ? undefined : msg.from ? { color: nickColor(msg.from) } : undefined
  }, msg.from), createElement("p", {
    className: "text-sm text-on-surface leading-relaxed break-words"
  }, ...renderParsedText(msg.text, users))));
}
function ChatInput() {
  const channel = store.getActiveChannel();
  const placeholder = channel ? `Message ${channel.name}` : "Select a channel";
  return createElement("div", {
    className: "px-4 pb-4 pt-2"
  }, createElement("form", {
    className: "flex items-center gap-2 rounded-xl border border-input bg-card/50 px-3 py-1.5 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-all",
    onSubmit: (e) => {
      e.preventDefault();
      const input = e.target.elements.message;
      const text = input.value.trim();
      if (text) {
        store.sendMessage(text);
        input.value = "";
      }
    }
  }, createElement("input", {
    name: "message",
    className: "flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none h-9",
    placeholder,
    autoComplete: "off",
    autoFocus: true
  }), createElement(Button, {
    type: "submit",
    variant: "ghost",
    size: "icon",
    className: "text-primary hover:text-primary flex-shrink-0"
  }, createElement("span", { className: "material-symbols-rounded text-xl" }, "send"))));
}
function ChatArea() {
  const state = store.getState();
  const network = store.getActiveNetwork();
  const channel = store.getActiveChannel();
  if (!network || !channel) {
    return createElement("div", {
      className: "flex flex-col flex-1 items-center justify-center text-muted-foreground"
    }, createElement("span", { className: "material-symbols-rounded text-6xl mb-4 opacity-30" }, "forum"), createElement("p", { className: "text-lg" }, "No channel selected"), createElement("p", { className: "text-sm mt-1" }, "Connect to a network to get started"));
  }
  const messages = channel.messages;
  return createElement("div", {
    className: "flex flex-col flex-1 min-w-0 min-h-0"
  }, createElement("div", {
    className: "flex items-center h-12 px-4 flex-shrink-0 border-b border-border gap-2"
  }, createElement(Button, {
    variant: "ghost",
    size: "icon-sm",
    className: "text-muted-foreground hover:text-foreground lg:hidden",
    onClick: () => store.toggleSidebar()
  }, createElement("span", { className: "material-symbols-rounded text-lg" }, "menu")), createElement("span", {
    className: "material-symbols-rounded text-lg text-on-surface-variant"
  }, channel.type === "channel" ? "tag" : channel.type === "query" ? "person" : "dns"), createElement("span", {
    className: "text-sm font-semibold text-on-surface"
  }, channel.type === "channel" ? channel.name.replace(/^#/, "") : channel.name), channel.topic ? createElement("span", {
    className: "text-xs text-muted-foreground ml-2 truncate hidden md:block"
  }, createElement("span", { className: "text-border mr-2" }, "|"), channel.topic) : null, createElement("div", { className: "flex-1" }), createElement("div", { className: "flex items-center gap-0.5" }, channel.type === "channel" ? createElement(Button, {
    variant: "ghost",
    size: "icon-sm",
    className: "text-muted-foreground hover:text-foreground",
    onClick: () => store.toggleUserlist()
  }, createElement("span", { className: "material-symbols-rounded text-lg" }, "group")) : null)), createElement("div", {
    className: "flex-1 overflow-y-auto",
    id: "messages-scroll",
    ref: (el) => {
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    }
  }, messages.length === 0 ? createElement("div", {
    className: "px-4 pt-8 pb-4 text-center"
  }, createElement("span", { className: "material-symbols-rounded text-4xl text-on-surface-variant/30 mb-2" }, "chat_bubble"), createElement("p", { className: "text-sm text-muted-foreground" }, `This is the beginning of ${channel.name}`)) : null, ...messages.flatMap((msg, i) => {
    const prev = messages[i - 1];
    const grouped = shouldGroup(msg, prev);
    const items = [];
    if (i === 0 || prev && isDifferentDay(prev.time, msg.time)) {
      items.push(createElement(DateSeparator, { key: `date_${msg.time}`, ts: msg.time }));
    }
    items.push(createElement(MessageItem, { key: msg.id, msg, grouped }));
    return items;
  }), createElement("div", { className: "h-2" })), createElement(ChatInput, null));
}

// src/client/components/UserList.tsx
var modeOrder = { q: 0, a: 1, o: 2, h: 3, v: 4 };
var modeSymbol = { q: "~", a: "&", o: "@", h: "%", v: "+" };
var modeLabel = { q: "Owner", a: "Admin", o: "Operator", h: "Half-Op", v: "Voiced" };
var modeColor = { q: "text-red-400", a: "text-purple-400", o: "text-online", h: "text-idle", v: "text-on-surface" };
function getUserPrimaryMode(user) {
  if (!user.modes || user.modes.length === 0)
    return null;
  const sorted = [...user.modes].sort((a, b) => (modeOrder[a] ?? 99) - (modeOrder[b] ?? 99));
  return sorted[0];
}
function groupUsers(users) {
  const groups = new Map;
  for (const user of Object.values(users)) {
    const mode = getUserPrimaryMode(user);
    if (!groups.has(mode))
      groups.set(mode, []);
    groups.get(mode).push(user);
  }
  for (const [, list] of groups) {
    list.sort((a, b) => a.nick.toLowerCase().localeCompare(b.nick.toLowerCase()));
  }
  const result3 = [];
  for (const mode of ["q", "a", "o", "h", "v"]) {
    const list = groups.get(mode);
    if (list && list.length > 0) {
      result3.push({ label: `${modeLabel[mode]} — ${list.length}`, mode, users: list });
    }
  }
  const noMode = groups.get(null);
  if (noMode && noMode.length > 0) {
    result3.push({ label: `Members — ${noMode.length}`, mode: null, users: noMode });
  }
  return result3;
}
function UserEntry({ user, mode }) {
  const prefix = mode ? modeSymbol[mode] || "" : "";
  const modeColorClass = mode ? modeColor[mode] || "text-on-surface" : "text-on-surface";
  const color = nickColor(user.nick);
  const profile = user.nostrPubkey ? nostr.getProfile(user.nostrPubkey) : undefined;
  const avatarUrl = profile?.picture || undefined;
  return createElement("div", {
    className: cn("flex items-center gap-2 px-3 py-1 mx-2 rounded-lg cursor-pointer transition-colors", "hover:bg-accent/40", user.away && "opacity-40"),
    title: user.away ? `${user.nick} (away: ${user.away})` : user.nick,
    onClick: () => {
      if (user.nostrPubkey) {
        store.openProfile(user.nostrPubkey);
      }
    }
  }, avatarUrl ? createElement("img", {
    src: avatarUrl,
    className: "size-7 rounded-full object-cover flex-shrink-0",
    onError: (e) => {
      e.target.style.display = "none";
    }
  }) : createElement("div", {
    className: "size-7 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-semibold flex-shrink-0",
    style: { color }
  }, user.nick.charAt(0).toUpperCase()), createElement("span", {
    className: cn("text-sm truncate", modeColorClass)
  }, prefix ? createElement("span", { className: "opacity-60 mr-0.5" }, prefix) : null, user.nick));
}
function UserList() {
  const channel = store.getActiveChannel();
  if (!channel || !channel.users)
    return null;
  const userCount = Object.keys(channel.users).length;
  const groups = groupUsers(channel.users);
  return createElement("div", {
    className: "w-[220px] flex-shrink-0 bg-surface-low overflow-y-auto border-l border-border"
  }, createElement("div", {
    className: "flex items-center gap-1.5 px-4 pt-3 pb-1"
  }, createElement("span", { className: "material-symbols-rounded text-sm text-on-surface-variant" }, "group"), createElement("span", {
    className: "text-[11px] font-medium text-on-surface-variant"
  }, `${userCount} user${userCount !== 1 ? "s" : ""}`)), ...groups.map((group) => createElement("div", { key: group.label, className: "mb-1" }, createElement("div", {
    className: "px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
  }, group.label), ...group.users.map((user) => createElement(UserEntry, { key: user.nick, user, mode: group.mode })))), createElement("div", { className: "h-4" }));
}

// ../blazecn/src/Input.tsx
function Input(props) {
  const { className, type = "text", ...rest } = props;
  return createElement2("input", {
    "data-slot": "input",
    type,
    ...rest,
    className: cn2("placeholder:text-muted-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none", "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]", "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", className)
  });
}

// ../blazecn/src/Label.tsx
function Label({ className, htmlFor, children }) {
  return createElement2("label", {
    "data-slot": "label",
    for: htmlFor,
    className: cn2("flex items-center gap-2 text-sm leading-none font-medium select-none", "peer-disabled:cursor-not-allowed peer-disabled:opacity-50", className)
  }, children);
}

// ../blazecn/src/Switch.tsx
function Switch({ className, checked = false, disabled = false, onChange }) {
  return createElement2("button", {
    "data-slot": "switch",
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled,
    onClick: () => onChange?.(!checked),
    className: cn2("peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-xs transition-all outline-none cursor-pointer", "focus-visible:ring-ring/50 focus-visible:ring-[3px]", "disabled:cursor-not-allowed disabled:opacity-50", checked ? "bg-primary" : "bg-muted-foreground/40", className)
  }, createElement2("span", {
    "data-slot": "switch-thumb",
    className: cn2("pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform", checked ? "translate-x-4" : "translate-x-0")
  }));
}

// ../blazecn/src/Card.tsx
function Card({ className, children, onClick }) {
  return createElement2("div", {
    "data-slot": "card",
    className: cn2("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", onClick && "cursor-pointer", className),
    onClick
  }, children);
}
function CardHeader({ className, children }) {
  return createElement2("div", {
    "data-slot": "card-header",
    className: cn2("grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6", className)
  }, children);
}
function CardTitle({ className, children }) {
  return createElement2("div", {
    "data-slot": "card-title",
    className: cn2("leading-none font-semibold", className)
  }, children);
}
function CardDescription({ className, children }) {
  return createElement2("div", {
    "data-slot": "card-description",
    className: cn2("text-muted-foreground text-sm", className)
  }, children);
}
function CardContent({ className, children }) {
  return createElement2("div", {
    "data-slot": "card-content",
    className: cn2("px-6", className)
  }, children);
}
function CardFooter({ className, children }) {
  return createElement2("div", {
    "data-slot": "card-footer",
    className: cn2("flex items-center px-6", className)
  }, children);
}

// ../blazecn/src/Tabs.tsx
function Tabs({ className, children }) {
  return createElement2("div", {
    "data-slot": "tabs",
    className: cn2("flex flex-col gap-2", className)
  }, children);
}
function TabsList({ className, children }) {
  return createElement2("div", {
    "data-slot": "tabs-list",
    role: "tablist",
    className: cn2("bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]", className)
  }, children);
}
function TabsTrigger(props) {
  const { className, value, active = false, disabled, onClick, children } = props;
  return createElement2("button", {
    "data-slot": "tabs-trigger",
    type: "button",
    role: "tab",
    "aria-selected": active,
    "data-state": active ? "active" : "inactive",
    "data-value": value,
    disabled,
    onClick,
    className: cn2("inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium transition-all outline-none", "focus-visible:ring-ring/50 focus-visible:ring-[3px]", "disabled:pointer-events-none disabled:opacity-50", "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent", className)
  }, children);
}
function TabsContent(props) {
  const { className, value, active = false, children } = props;
  if (!active)
    return null;
  return createElement2("div", {
    "data-slot": "tabs-content",
    role: "tabpanel",
    "data-value": value,
    className: cn2("flex-1 outline-none", className)
  }, children);
}

// src/client/components/ConnectForm.tsx
function Field({ label, htmlFor, children, className }) {
  return createElement("div", { className: `grid gap-2 ${className || ""}` }, createElement(Label, { htmlFor, className: "text-muted-foreground text-xs" }, label), children);
}
function HiddenBool({ name, value }) {
  return createElement("input", { type: "hidden", name, value: value ? "1" : "" });
}
var _authTab = "none";
var _tls = true;
var _nsRegister = false;
function ConnectForm() {
  const state = store.getState();
  const onSubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    const nsPassword = f.elements.ns_password?.value || "";
    const options3 = {
      name: f.elements.name.value || f.elements.host.value,
      host: f.elements.host.value,
      port: parseInt(f.elements.port.value) || 6667,
      tls: f.elements.tls_val.value === "1",
      nick: f.elements.nick.value || "hyphae_user",
      username: f.elements.username?.value || undefined,
      realname: f.elements.realname?.value || undefined,
      password: _authTab === "password" ? f.elements.password?.value || undefined : undefined,
      saslAccount: _authTab === "sasl" ? f.elements.sasl_account?.value || undefined : undefined,
      saslPassword: _authTab === "sasl" ? f.elements.sasl_password?.value || undefined : undefined,
      autojoin: f.elements.autojoin.value ? f.elements.autojoin.value.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      nickservPassword: _authTab === "nostr" ? nsPassword || undefined : undefined,
      nickservRegister: _authTab === "nostr" ? f.elements.ns_register_val?.value === "1" || undefined : undefined,
      nostrPubkey: _authTab === "nostr" && nsPassword && state.nostrPubkey ? state.nostrPubkey : undefined
    };
    store.connect(options3);
  };
  const setAuth = (t) => {
    _authTab = t;
    store["notify"]();
  };
  return createElement(Card, {
    className: "w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col border-border/50 shadow-2xl"
  }, createElement("form", { onSubmit, className: "flex flex-col flex-1 min-h-0" }, createElement(CardHeader, { className: "pb-2" }, createElement("div", { className: "flex items-center gap-3" }, createElement("div", {
    className: "size-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl"
  }, "\uD83E\uDDA6"), createElement("div", null, createElement(CardTitle, null, "Connect to IRC"), createElement(CardDescription, null, "Add a new network connection")))), createElement(CardContent, { className: "flex flex-col flex-1 min-h-0 gap-0 pb-0" }, createElement("div", { className: "flex-1 overflow-y-auto min-h-0 space-y-4 pb-2" }, createElement("div", { className: "grid grid-cols-[1fr_80px] gap-3" }, createElement(Field, { label: "Server", htmlFor: "host" }, createElement(Input, {
    id: "host",
    name: "host",
    placeholder: "irc.example.com"
  })), createElement(Field, { label: "Port", htmlFor: "port" }, createElement(Input, {
    id: "port",
    name: "port",
    type: "number",
    placeholder: "6697",
    value: "6697"
  }))), createElement("div", { className: "grid grid-cols-2 gap-3" }, createElement(Field, { label: "Network Name", htmlFor: "name" }, createElement(Input, {
    id: "name",
    name: "name",
    placeholder: "My Network"
  })), createElement("div", { className: "grid gap-2" }, createElement(Label, { className: "text-muted-foreground text-xs" }, "Secure Connection"), createElement("div", { className: "flex items-center gap-2 h-9" }, createElement(Switch, {
    checked: _tls,
    onChange: (v) => {
      _tls = v;
      store["notify"]();
    }
  }), createElement("span", { className: "text-sm text-muted-foreground" }, _tls ? "TLS On" : "TLS Off"), createElement(HiddenBool, { name: "tls_val", value: _tls })))), createElement(Separator, null), createElement(Field, { label: "Nickname", htmlFor: "nick" }, createElement(Input, {
    id: "nick",
    name: "nick",
    placeholder: "hyphae_user"
  })), createElement("div", { className: "grid grid-cols-2 gap-3" }, createElement(Field, { label: "Username", htmlFor: "username" }, createElement(Input, {
    id: "username",
    name: "username",
    placeholder: "Optional"
  })), createElement(Field, { label: "Real Name", htmlFor: "realname" }, createElement(Input, {
    id: "realname",
    name: "realname",
    placeholder: "Optional"
  }))), createElement(Field, { label: "Auto-join Channels", htmlFor: "autojoin" }, createElement(Input, {
    id: "autojoin",
    name: "autojoin",
    placeholder: "#general, #random"
  })), createElement(Separator, null), createElement("div", { className: "space-y-1" }, createElement("h3", { className: "text-sm font-medium text-foreground" }, "Authentication"), createElement("p", { className: "text-xs text-muted-foreground" }, "Choose how to authenticate with this server.")), createElement(Tabs, { value: _authTab, className: "w-full" }, createElement(TabsList, { className: "w-full grid grid-cols-4" }, createElement(TabsTrigger, {
    value: "none",
    active: _authTab === "none",
    onClick: () => setAuth("none")
  }, "None"), createElement(TabsTrigger, {
    value: "password",
    active: _authTab === "password",
    onClick: () => setAuth("password")
  }, "Password"), createElement(TabsTrigger, {
    value: "sasl",
    active: _authTab === "sasl",
    onClick: () => setAuth("sasl")
  }, "SASL"), createElement(TabsTrigger, {
    value: "nostr",
    active: _authTab === "nostr",
    onClick: () => setAuth("nostr")
  }, "⚡ Nostr")), createElement(TabsContent, { value: "none", active: _authTab === "none", className: "pt-3" }, createElement("p", {
    className: "text-sm text-muted-foreground text-center py-4"
  }, "No authentication. Connect as a guest.")), createElement(TabsContent, { value: "password", active: _authTab === "password", className: "pt-3 space-y-4" }, createElement("p", {
    className: "text-xs text-muted-foreground"
  }, "Server password sent during connection. Most servers don't require this."), createElement(Field, { label: "Server Password", htmlFor: "password" }, createElement(Input, {
    id: "password",
    name: "password",
    type: "password",
    placeholder: "Server password"
  }))), createElement(TabsContent, { value: "sasl", active: _authTab === "sasl", className: "pt-3 space-y-4" }, createElement("p", {
    className: "text-xs text-muted-foreground"
  }, "SASL PLAIN authentication during connection. Required by some networks like Libera.Chat."), createElement("div", { className: "grid grid-cols-2 gap-3" }, createElement(Field, { label: "Account", htmlFor: "sasl_account" }, createElement(Input, {
    id: "sasl_account",
    name: "sasl_account",
    placeholder: "Account name"
  })), createElement(Field, { label: "Password", htmlFor: "sasl_password" }, createElement(Input, {
    id: "sasl_password",
    name: "sasl_password",
    type: "password",
    placeholder: "Password"
  })))), createElement(TabsContent, { value: "nostr", active: _authTab === "nostr", className: "pt-3 space-y-4" }, createElement("p", {
    className: "text-xs text-muted-foreground"
  }, "Use your Nostr identity to register or identify with NickServ. Requires a NIP-07 browser extension."), createElement(Button, {
    variant: state.nostrPubkey ? "secondary" : "outline",
    className: state.nostrPubkey ? "w-full border-online/30 text-online bg-online/10 hover:bg-online/15 h-auto py-2" : "w-full",
    onClick: async () => {
      if (state.nostrPubkey)
        return;
      try {
        const pubkey = await nostr.loginWithExtension();
        store.setNostrPubkey(pubkey);
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  }, state.nostrPubkey ? (() => {
    const profile = nostr.getProfile(state.nostrPubkey);
    return createElement("div", { className: "flex items-center gap-2.5 w-full" }, profile?.picture ? createElement("img", {
      src: profile.picture,
      className: "size-7 rounded-full object-cover flex-shrink-0",
      onError: (e) => {
        e.target.style.display = "none";
      }
    }) : createElement("span", { className: "text-base" }, "⚡"), createElement("div", { className: "flex flex-col items-start min-w-0" }, createElement("span", { className: "text-xs font-semibold truncate" }, profile?.displayName || profile?.name || "Connected"), createElement("span", { className: "text-[10px] opacity-70 truncate" }, state.nostrPubkey.slice(0, 16) + "…")));
  })() : createElement("span", { className: "flex items-center gap-1.5" }, createElement("span", null, "⚡"), "Connect Nostr Identity")), state.nostrPubkey ? createElement("div", { className: "space-y-4" }, createElement(Separator, null), createElement(Field, { label: "NickServ Password", htmlFor: "ns_password" }, createElement(Input, {
    id: "ns_password",
    name: "ns_password",
    type: "password",
    placeholder: "Password for NickServ account"
  })), createElement("div", { className: "flex items-center gap-3" }, createElement(Switch, {
    checked: _nsRegister,
    onChange: (v) => {
      _nsRegister = v;
      store["notify"]();
    }
  }), createElement(HiddenBool, { name: "ns_register_val", value: _nsRegister }), createElement("div", null, createElement(Label, null, "Register new account"), createElement("p", { className: "text-xs text-muted-foreground mt-0.5" }, "Server will send a verification code via Nostr DM")))) : createElement("div", {
    className: "rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground"
  }, "Connect your Nostr identity to enable NickServ integration"))))), createElement(CardFooter, { className: "gap-3 pt-4 pb-6" }, state.networks.length > 0 ? createElement(Button, {
    variant: "ghost",
    className: "flex-1",
    onClick: () => store.closeConnectForm()
  }, "Cancel") : null, createElement(Button, {
    type: "submit",
    className: "flex-1"
  }, "Connect"))));
}

// src/client/components/ProfilePanel.tsx
function ProfilePanel({ pubkey, onClose }) {
  const profile = nostr.getProfile(pubkey);
  const shortPubkey = pubkey.slice(0, 8) + "…" + pubkey.slice(-8);
  if (!profile) {
    nostr.fetchProfile(pubkey);
  }
  return createElement("div", {
    className: "fixed inset-0 bg-black/60 flex items-center justify-center z-50",
    onClick: (e) => {
      if (e.target === e.currentTarget)
        onClose();
    }
  }, createElement("div", {
    className: "w-full max-w-md bg-surface-high rounded-2xl border border-border shadow-2xl overflow-hidden"
  }, profile?.banner ? createElement("div", {
    className: "h-32 bg-cover bg-center",
    style: { backgroundImage: `url(${profile.banner})` }
  }) : createElement("div", {
    className: "h-32 bg-gradient-to-br from-primary/30 to-primary/10"
  }), createElement("div", { className: "px-6 -mt-12 relative" }, createElement("div", {
    className: "size-24 rounded-full border-4 border-surface-high overflow-hidden bg-surface-variant flex items-center justify-center"
  }, profile?.picture ? createElement("img", {
    src: profile.picture,
    alt: profile.displayName || profile.name || "Avatar",
    className: "size-full object-cover",
    onError: (e) => {
      e.target.style.display = "none";
    }
  }) : createElement("span", {
    className: "text-3xl font-bold text-on-surface-variant"
  }, (profile?.name || pubkey).charAt(0).toUpperCase()))), createElement("div", { className: "px-6 pt-3 pb-6 space-y-3" }, createElement("div", null, profile?.displayName ? createElement("h2", {
    className: "text-xl font-bold text-on-surface"
  }, profile.displayName) : null, profile?.name ? createElement("p", {
    className: cn("text-sm", profile?.displayName ? "text-muted-foreground" : "text-lg font-semibold text-on-surface")
  }, profile.displayName ? `@${profile.name}` : profile.name) : null, !profile?.displayName && !profile?.name ? createElement("h2", {
    className: "text-lg font-semibold text-on-surface"
  }, shortPubkey) : null), profile?.nip05 ? createElement("div", {
    className: "flex items-center gap-1.5 text-sm"
  }, createElement("span", {
    className: "material-symbols-rounded text-base text-primary"
  }, "verified"), createElement("span", { className: "text-primary" }, profile.nip05)) : null, createElement("div", {
    className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-variant/50 text-xs font-mono text-muted-foreground cursor-pointer hover:bg-surface-variant transition-colors",
    title: "Click to copy pubkey",
    onClick: () => {
      navigator.clipboard?.writeText(pubkey);
    }
  }, createElement("span", { className: "material-symbols-rounded text-sm flex-shrink-0" }, "key"), createElement("span", { className: "truncate" }, pubkey), createElement("span", { className: "material-symbols-rounded text-sm flex-shrink-0 ml-auto" }, "content_copy")), profile?.about ? createElement("div", { className: "space-y-1" }, createElement("p", {
    className: "text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
  }, "About"), createElement("p", {
    className: "text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words"
  }, profile.about)) : null, profile?.lud16 ? createElement("div", { className: "flex flex-wrap gap-3" }, createElement("div", {
    className: "flex items-center gap-1 text-sm text-idle"
  }, createElement("span", null, "⚡"), createElement("span", null, profile.lud16))) : null, !profile ? createElement("div", {
    className: "flex items-center justify-center py-4 text-muted-foreground"
  }, createElement("span", {
    className: "material-symbols-rounded text-xl animate-spin mr-2"
  }, "progress_activity"), createElement("span", { className: "text-sm" }, "Loading profile…")) : null, createElement("button", {
    className: "w-full mt-2 px-4 py-2.5 rounded-lg border border-border text-sm text-on-surface-variant font-medium hover:bg-accent/30 transition-colors cursor-pointer",
    onClick: onClose
  }, "Close"))));
}

// ../blazecn/src/RadioGroup.tsx
function RadioGroup(props) {
  const { className, children } = props;
  return createElement2("div", {
    "data-slot": "radio-group",
    role: "radiogroup",
    className: cn2("grid gap-3", className)
  }, children);
}
function RadioGroupItem(props) {
  const { className, value, checked = false, disabled = false, id, onClick } = props;
  return createElement2("button", {
    "data-slot": "radio-group-item",
    type: "button",
    role: "radio",
    id,
    "aria-checked": checked,
    "data-state": checked ? "checked" : "unchecked",
    "data-value": value,
    disabled,
    onClick,
    className: cn2("aspect-square size-4 shrink-0 rounded-full border-2 shadow-xs transition-all outline-none cursor-pointer", "focus-visible:ring-ring/50 focus-visible:ring-[3px]", "disabled:cursor-not-allowed disabled:opacity-50", checked ? "border-primary" : "border-input", className)
  }, checked ? createElement2("span", {
    className: "flex items-center justify-center"
  }, createElement2("span", {
    className: "size-2 rounded-full bg-primary"
  })) : null);
}

// src/client/components/SettingsPage.tsx
function SettingRow({ label, description, children }) {
  return createElement("div", { className: "flex items-center justify-between gap-4 py-2" }, createElement("div", { className: "flex-1 min-w-0" }, createElement(Label, { className: "text-sm font-medium text-foreground" }, label), description ? createElement("p", { className: "text-xs text-muted-foreground mt-0.5" }, description) : null), children);
}
function SectionHeader({ icon, title, description }) {
  return createElement("div", { className: "flex items-center gap-3 pb-2" }, createElement("div", { className: "size-8 rounded-lg bg-primary/10 flex items-center justify-center" }, createElement("span", { className: "material-symbols-rounded text-base text-primary" }, icon)), createElement("div", null, createElement("h3", { className: "text-sm font-semibold text-foreground" }, title), description ? createElement("p", { className: "text-xs text-muted-foreground" }, description) : null));
}
function RadioOption({ label, value, name, checked, onChange }) {
  const id = `${name}-${value}`;
  return createElement("div", {
    className: cn("flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors", checked ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"),
    onClick: onChange
  }, createElement(RadioGroupItem, { value, checked, id, onClick: onChange }), createElement(Label, { htmlFor: id, className: "text-sm cursor-pointer" }, label));
}
function AppGeneral() {
  const state = store.getState();
  return createElement("div", { className: "space-y-6" }, createElement(SectionHeader, { icon: "info", title: "Hyphae" }), createElement("div", { className: "pl-1 space-y-3" }, createElement("p", { className: "text-sm text-muted-foreground leading-relaxed" }, "IRC and peer-to-peer chat, woven together."), createElement("p", { className: "text-[10px] text-muted-foreground/30 font-mono select-none" }, "⋆˙\uD80C\uDF4A₊ ‹˚ \uD80D\uDE67\uD80C\uDEFC˖°\uD80C\uDD91˙⋆")), createElement(Separator, null), createElement(SectionHeader, { icon: "bolt", title: "Nostr Identity", description: "NIP-07 browser extension" }), createElement("div", { className: "pl-1 space-y-3" }, createElement(Button, {
    variant: state.nostrPubkey ? "secondary" : "outline",
    className: state.nostrPubkey ? "w-full border-online/30 text-online bg-online/10 hover:bg-online/15" : "w-full",
    onClick: async () => {
      if (state.nostrPubkey)
        return;
      try {
        const pubkey = await nostr.loginWithExtension();
        store.setNostrPubkey(pubkey);
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  }, createElement("span", null, "⚡"), state.nostrPubkey ? `Connected: ${state.nostrPubkey.slice(0, 16)}…` : "Connect Nostr Identity"), state.nostrPubkey ? createElement("div", {
    className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground cursor-pointer hover:bg-accent/30 transition-colors",
    title: "Click to copy",
    onClick: () => navigator.clipboard?.writeText(state.nostrPubkey)
  }, createElement("span", { className: "material-symbols-rounded text-sm flex-shrink-0" }, "key"), createElement("span", { className: "truncate" }, state.nostrPubkey), createElement("span", { className: "material-symbols-rounded text-sm flex-shrink-0 ml-auto" }, "content_copy")) : null), createElement(Separator, null), createElement(SectionHeader, { icon: "palette", title: "Theme" }), createElement("div", { className: "pl-1" }, createElement("p", { className: "text-xs text-muted-foreground" }, "Dark mode is currently the only theme. More coming soon.")));
}
function IrcAppearance() {
  const { settings } = store.getState();
  return createElement("div", { className: "space-y-6" }, createElement(SectionHeader, { icon: "chat", title: "Messages" }), createElement("div", { className: "space-y-1 pl-1" }, createElement(SettingRow, { label: "Show seconds in timestamps", description: "Display seconds alongside hours and minutes" }, createElement(Switch, { checked: settings.showSeconds, onChange: (v) => store.updateSetting("showSeconds", v) })), createElement(SettingRow, { label: "Use 12-hour clock", description: "Show AM/PM instead of 24-hour time" }, createElement(Switch, { checked: settings.use12hClock, onChange: (v) => store.updateSetting("use12hClock", v) })), createElement(SettingRow, { label: "Show MOTD", description: "Display the Message of the Day on connect" }, createElement(Switch, { checked: settings.showMotd, onChange: (v) => store.updateSetting("showMotd", v) }))), createElement(Separator, null), createElement(SectionHeader, { icon: "info", title: "Status Messages", description: "Joins, parts, quits, nick changes" }), createElement(RadioGroup, { value: settings.statusMessages, className: "gap-1 pl-1" }, createElement(RadioOption, { label: "Show all", value: "shown", name: "statusMessages", checked: settings.statusMessages === "shown", onChange: () => store.updateSetting("statusMessages", "shown") }), createElement(RadioOption, { label: "Condense", value: "condensed", name: "statusMessages", checked: settings.statusMessages === "condensed", onChange: () => store.updateSetting("statusMessages", "condensed") }), createElement(RadioOption, { label: "Hide all", value: "hidden", name: "statusMessages", checked: settings.statusMessages === "hidden", onChange: () => store.updateSetting("statusMessages", "hidden") })), createElement(Separator, null), createElement(SectionHeader, { icon: "palette", title: "Visual Aids" }), createElement("div", { className: "space-y-1 pl-1" }, createElement(SettingRow, { label: "Colored nicknames", description: "Unique color per nick" }, createElement(Switch, { checked: settings.coloredNicks, onChange: (v) => store.updateSetting("coloredNicks", v) })), createElement(SettingRow, { label: "Autocomplete", description: "Tab-completion for nicks and commands" }, createElement(Switch, { checked: settings.autocomplete, onChange: (v) => store.updateSetting("autocomplete", v) })), createElement("div", { className: "py-2" }, createElement(Label, { htmlFor: "nickPostfix", className: "text-sm font-medium text-foreground" }, "Nick autocomplete postfix"), createElement("p", { className: "text-xs text-muted-foreground mb-2" }, "Character(s) appended after completing a nick"), createElement(Input, { id: "nickPostfix", value: settings.nickPostfix, className: "max-w-[120px]", onInput: (e) => store.updateSetting("nickPostfix", e.target.value) }))));
}
function IrcNotifications() {
  const { settings } = store.getState();
  return createElement("div", { className: "space-y-6" }, createElement(SectionHeader, { icon: "notifications", title: "Browser Notifications" }), createElement("div", { className: "space-y-1 pl-1" }, createElement(SettingRow, { label: "Desktop notifications", description: "Show browser notifications for highlights" }, createElement(Switch, {
    checked: settings.desktopNotifications,
    onChange: (v) => {
      if (v && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          store.updateSetting("desktopNotifications", perm === "granted");
        });
      } else {
        store.updateSetting("desktopNotifications", v);
      }
    }
  })), createElement(SettingRow, { label: "Notification sound", description: "Play a sound on notification" }, createElement(Switch, { checked: settings.notificationSound, onChange: (v) => store.updateSetting("notificationSound", v) })), createElement(SettingRow, { label: "Notify for all messages", description: "Not just highlights" }, createElement(Switch, { checked: settings.notifyAllMessages, onChange: (v) => store.updateSetting("notifyAllMessages", v) }))), createElement(Separator, null), createElement(SectionHeader, { icon: "highlight", title: "Highlights", description: "Words that trigger notifications" }), createElement("div", { className: "space-y-4 pl-1" }, createElement("div", null, createElement(Label, { htmlFor: "highlights", className: "text-sm font-medium text-foreground" }, "Custom highlights"), createElement("p", { className: "text-xs text-muted-foreground mb-2" }, "Comma-separated words"), createElement(Input, { id: "highlights", value: settings.highlights, placeholder: "word1, word2", onInput: (e) => store.updateSetting("highlights", e.target.value) })), createElement("div", null, createElement(Label, { htmlFor: "highlightExceptions", className: "text-sm font-medium text-foreground" }, "Exceptions"), createElement("p", { className: "text-xs text-muted-foreground mb-2" }, "Words that prevent a highlight"), createElement(Input, { id: "highlightExceptions", value: settings.highlightExceptions, placeholder: "bot, service", onInput: (e) => store.updateSetting("highlightExceptions", e.target.value) }))));
}
function IrcGeneral() {
  const state = store.getState();
  const { settings } = state;
  return createElement("div", { className: "space-y-6" }, createElement(SectionHeader, { icon: "schedule", title: "Away Message" }), createElement("div", { className: "pl-1" }, createElement(Label, { htmlFor: "awayMessage", className: "text-sm font-medium text-foreground" }, "Automatic away message"), createElement("p", { className: "text-xs text-muted-foreground mb-2" }, "Set when you close the client or go idle"), createElement(Input, { id: "awayMessage", value: settings.awayMessage, placeholder: "Away from keyboard", onInput: (e) => store.updateSetting("awayMessage", e.target.value) })), createElement(Separator, null), createElement(SectionHeader, { icon: "bolt", title: "Nostr Identity", description: "NIP-07 browser extension" }), createElement("div", { className: "pl-1 space-y-3" }, createElement(Button, {
    variant: state.nostrPubkey ? "secondary" : "outline",
    className: state.nostrPubkey ? "w-full border-online/30 text-online bg-online/10 hover:bg-online/15" : "w-full",
    onClick: async () => {
      if (state.nostrPubkey)
        return;
      try {
        const pubkey = await nostr.loginWithExtension();
        store.setNostrPubkey(pubkey);
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  }, createElement("span", null, "⚡"), state.nostrPubkey ? `Connected: ${state.nostrPubkey.slice(0, 16)}…` : "Connect Nostr Identity"), state.nostrPubkey ? createElement("div", {
    className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground cursor-pointer hover:bg-accent/30 transition-colors",
    title: "Click to copy",
    onClick: () => navigator.clipboard?.writeText(state.nostrPubkey)
  }, createElement("span", { className: "material-symbols-rounded text-sm flex-shrink-0" }, "key"), createElement("span", { className: "truncate" }, state.nostrPubkey), createElement("span", { className: "material-symbols-rounded text-sm flex-shrink-0 ml-auto" }, "content_copy")) : null), createElement(Separator, null), createElement(SectionHeader, { icon: "info", title: "About" }), createElement("div", { className: "pl-1 space-y-3" }, createElement("div", { className: "flex items-center gap-3" }, createElement("p", { className: "text-lg font-semibold text-foreground" }, "Hyphae"), createElement("span", { className: "text-xs text-muted-foreground/40 font-mono" }, "• \uD835\uDCE3\uD835\uDCF1\uD835\uDCEE \uD835\uDCF6\uD835\uDCEE\uD835\uDCFC\uD835\uDCFC\uD835\uDCEA\uD835\uDCF0\uD835\uDCEE \uD835\uDCF5\uD835\uDCEA\uD835\uDCFE\uD835\uDCEE\uD835\uDCF7")), createElement("p", { className: "text-xs text-muted-foreground leading-relaxed" }, "IRC + P2P Chat. Built with InfernoJS, Bun, and Kaji."), createElement("p", { className: "text-[10px] text-muted-foreground/30 font-mono select-none" }, "⋆˙\uD80C\uDF4A₊ ‹˚ \uD80D\uDE67\uD80C\uDEFC˖°\uD80C\uDD91˙⋆")));
}
function P2PProfile() {
  const p2p = p2pStore.getState();
  const settings = p2p.userSettings;
  return createElement("div", { className: "space-y-6" }, createElement(SectionHeader, { icon: "person", title: "Profile" }), createElement("div", { className: "space-y-4 pl-1 max-w-md" }, createElement("div", null, createElement(Label, { className: "text-sm font-medium text-foreground mb-1.5 block" }, "Display Name"), createElement("input", {
    type: "text",
    className: "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
    placeholder: "Anonymous",
    value: settings?.customUsername || "",
    oninput: (e) => {
      p2pStore.updateSettings({ customUsername: e.target.value });
    }
  }), createElement("p", { className: "text-xs text-muted-foreground mt-1" }, "Shown to other peers in P2P rooms.")), settings ? createElement("div", null, createElement(Label, { className: "text-sm font-medium text-foreground mb-1.5 block" }, "User ID"), createElement("div", { className: "rounded-lg border border-input bg-background/50 px-3 py-2 text-xs text-muted-foreground font-mono truncate" }, settings.userId), createElement("p", { className: "text-xs text-muted-foreground mt-1" }, "Auto-generated unique identity.")) : null));
}
function P2PNotifications() {
  const p2p = p2pStore.getState();
  const settings = p2p.userSettings;
  return createElement("div", { className: "space-y-6" }, createElement(SectionHeader, { icon: "notifications", title: "Notifications" }), createElement("div", { className: "space-y-1 pl-1" }, createElement(SettingRow, { label: "Play sound on new message" }, createElement(Switch, { checked: settings?.playSoundOnNewMessage ?? true, onChange: (v) => p2pStore.updateSettings({ playSoundOnNewMessage: v }) })), createElement(SettingRow, { label: "Show browser notifications" }, createElement(Switch, { checked: settings?.showNotificationOnNewMessage ?? true, onChange: (v) => p2pStore.updateSettings({ showNotificationOnNewMessage: v }) })), createElement(SettingRow, { label: "Show typing indicator to peers" }, createElement(Switch, { checked: settings?.showActiveTypingStatus ?? true, onChange: (v) => p2pStore.updateSettings({ showActiveTypingStatus: v }) }))), createElement(Separator, null), createElement(SectionHeader, { icon: "music_note", title: "Notification Sound" }), createElement("div", { className: "pl-1" }, createElement("select", {
    className: "w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
    value: settings?.selectedSound || "",
    onchange: (e) => {
      p2pStore.updateSettings({ selectedSound: e.target.value });
    }
  }, ...soundOptions.map((opt) => createElement("option", { key: opt.value, value: opt.value }, opt.label)))));
}
function P2PAbout() {
  return createElement("div", { className: "space-y-6" }, createElement(SectionHeader, { icon: "info", title: "About P2P Chat" }), createElement("div", { className: "space-y-3 pl-1 max-w-lg text-sm text-on-surface-variant leading-relaxed" }, createElement("p", null, "P2P Chat uses ", createElement("strong", { className: "text-foreground" }, "trystero"), " for peer-to-peer communication via WebRTC. Messages are sent directly between browsers — no server stores your conversations."), createElement("p", null, "Features: encrypted peer verification, audio/video calls, screen sharing, file transfer, and direct messages."), createElement("p", null, "Room connections are established through BitTorrent tracker signaling.")));
}
function P2PData() {
  const p2p = p2pStore.getState();
  return createElement("div", { className: "space-y-6" }, createElement(SectionHeader, { icon: "database", title: "Data Management" }), createElement("div", { className: "flex gap-2 pl-1" }, createElement(Button, {
    variant: "outline",
    size: "sm",
    onClick: () => {
      const data = JSON.stringify(p2p, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "p2p-settings.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  }, "Export Settings"), createElement(Button, {
    variant: "destructive",
    size: "sm",
    onClick: () => {
      localStorage.removeItem("chitchatter:settings");
      window.location.reload();
    }
  }, "Reset All P2P Data")));
}
var NAV_ITEMS = [
  { id: "app-general", icon: "tune", label: "Application", group: "Hyphae" },
  { id: "irc-appearance", icon: "palette", label: "Appearance", group: "IRC" },
  { id: "irc-notifications", icon: "notifications", label: "Notifications", group: "IRC" },
  { id: "irc-general", icon: "settings", label: "General", group: "IRC" },
  { id: "p2p-profile", icon: "person", label: "Profile", group: "P2P" },
  { id: "p2p-notifications", icon: "volume_up", label: "Notifications", group: "P2P" },
  { id: "p2p-about", icon: "info", label: "About", group: "P2P" },
  { id: "p2p-data", icon: "database", label: "Data", group: "P2P" }
];
var CONTENT_MAP = {
  "app-general": AppGeneral,
  "irc-appearance": IrcAppearance,
  "irc-notifications": IrcNotifications,
  "irc-general": IrcGeneral,
  "p2p-profile": P2PProfile,
  "p2p-notifications": P2PNotifications,
  "p2p-about": P2PAbout,
  "p2p-data": P2PData
};
function SettingsPage() {
  const state = store.getState();
  const activePage = state.settingsPage;
  const sidebarWidth = state.sidebarWidth;
  const ContentComponent = CONTENT_MAP[activePage];
  let lastGroup = "";
  return createElement("div", { className: "flex flex-1 min-w-0 overflow-hidden" }, createElement("div", {
    className: "flex-shrink-0 border-r border-border overflow-y-auto bg-surface-high",
    style: { width: `${sidebarWidth}px` }
  }, createElement("div", { className: "flex items-center h-12 px-4 flex-shrink-0 border-b border-border gap-2" }, createElement("span", { className: "material-symbols-rounded text-lg text-primary" }, "settings"), createElement("h2", { className: "text-sm font-semibold text-on-surface flex-1" }, "Settings")), createElement("div", { className: "p-2 space-y-0.5" }, ...NAV_ITEMS.map((item) => {
    const showGroup = item.group !== lastGroup;
    lastGroup = item.group;
    return [
      showGroup ? createElement("div", {
        key: `group-${item.group}`,
        className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2 pt-3 pb-1"
      }, item.group) : null,
      createElement("button", {
        key: item.id,
        className: cn("flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer", activePage === item.id ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"),
        onClick: () => store.setSettingsPage(item.id)
      }, createElement("span", { className: "material-symbols-rounded text-base flex-shrink-0" }, item.icon), item.label)
    ];
  }).flat())), createElement("div", { className: "flex-1 overflow-y-auto" }, createElement("div", { className: "max-w-2xl p-6" }, ContentComponent ? createElement(ContentComponent, null) : null)));
}

// src/client/components/HomePage.tsx
var _homeTab = "lander";
function FeatureCard({ icon, title, description, action, actionLabel, color }) {
  return createElement("div", {
    className: "flex flex-col rounded-xl border border-border/50 bg-surface-high/50 p-5 hover:border-border transition-colors"
  }, createElement("div", {
    className: `size-10 rounded-lg flex items-center justify-center mb-3 ${color}`
  }, createElement("span", { className: "material-symbols-rounded text-xl" }, icon)), createElement("h3", { className: "text-base font-semibold text-foreground mb-1" }, title), createElement("p", { className: "text-sm text-muted-foreground leading-relaxed mb-4 flex-1" }, description), createElement("button", {
    className: `inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${color} hover:opacity-90`,
    onClick: action
  }, createElement("span", { className: "material-symbols-rounded text-base" }, "arrow_forward"), actionLabel));
}
function StatCard({ icon, label, value }) {
  return createElement("div", {
    className: "flex items-center gap-3 rounded-lg border border-border/30 bg-surface-high/30 px-4 py-3"
  }, createElement("span", { className: "material-symbols-rounded text-lg text-muted-foreground" }, icon), createElement("div", null, createElement("p", { className: "text-xs text-muted-foreground" }, label), createElement("p", { className: "text-sm font-medium text-foreground" }, value)));
}
function LanderContent() {
  const state = store.getState();
  const p2p = p2pStore.getState();
  const profile = state.nostrPubkey ? nostr.getProfile(state.nostrPubkey) : null;
  const displayName = profile?.displayName || profile?.name || null;
  const connectedNetworks = state.networks.filter((n) => n.connected).length;
  const totalChannels = state.networks.reduce((sum, n) => sum + n.channels.length, 0);
  const p2pPeers = p2p.peerList.length;
  return createElement("div", { className: "max-w-2xl mx-auto px-6 py-10" }, createElement("div", { className: "mb-8" }, createElement("h1", { className: "text-2xl font-bold text-foreground mb-1" }, "Hyphae"), createElement("p", { className: "text-[10px] text-muted-foreground/30 font-mono select-none mb-3" }, "\uD80C\uDF4A\uD80C\uDEFC\uD80C\uDD8F\uD80C\uDEFC\uD80C\uDF4A"), displayName ? createElement("p", { className: "text-muted-foreground" }, "Hey, ", createElement("span", { className: "text-foreground font-medium" }, displayName), "! What would you like to do?") : createElement("p", { className: "text-muted-foreground" }, "IRC and peer-to-peer chat, woven together.")), createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8" }, createElement(FeatureCard, {
    icon: "dns",
    title: "IRC Chat",
    description: "Connect to IRC servers, join channels, and chat with communities. Supports SASL, NickServ, and Nostr identity.",
    action: () => store.setAppMode("irc"),
    actionLabel: "Open IRC",
    color: "bg-primary/10 text-primary"
  }), createElement(FeatureCard, {
    icon: "hub",
    title: "P2P Chat",
    description: "Peer-to-peer encrypted rooms with no server. Voice/video calls, screen sharing, and file transfer.",
    action: () => store.setAppMode("p2p"),
    actionLabel: "Open P2P",
    color: "bg-online/10 text-online"
  })), connectedNetworks > 0 || p2p.roomId ? createElement("div", { className: "mb-8" }, createElement(Separator, { className: "mb-4" }), createElement("h2", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" }, "Active Sessions"), createElement("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3" }, createElement(StatCard, { icon: "dns", label: "IRC Networks", value: `${connectedNetworks} connected` }), createElement(StatCard, { icon: "tag", label: "Channels", value: `${totalChannels} joined` }), createElement(StatCard, { icon: "group", label: "P2P Peers", value: p2p.roomId ? `${p2pPeers} online` : "Not in a room" }))) : null, createElement("div", { className: "text-center" }, createElement("p", { className: "text-[10px] text-muted-foreground/25 font-mono select-none" }, "⋆˙\uD80C\uDF4A₊ ⊹˚ \uD81A\uDD67\uD80C\uDEFC˖°\uD80C\uDD91˙⋆")));
}
function ProfileContent() {
  const state = store.getState();
  const profile = state.nostrPubkey ? nostr.getProfile(state.nostrPubkey) : null;
  const displayName = profile?.displayName || profile?.name || null;
  if (!state.nostrPubkey) {
    return createElement("div", { className: "max-w-md mx-auto px-6 py-16 text-center" }, createElement("div", {
      className: "size-20 rounded-full bg-surface-variant flex items-center justify-center mx-auto mb-6"
    }, createElement("span", { className: "material-symbols-rounded text-4xl text-muted-foreground" }, "person")), createElement("h2", { className: "text-xl font-semibold text-foreground mb-2" }, "Sign in with Nostr"), createElement("p", { className: "text-sm text-muted-foreground mb-6 leading-relaxed" }, "Connect a Nostr identity (NIP-07) to use your profile across IRC and P2P. Your keys stay in your browser extension."), createElement("button", {
      className: cn("inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer", window.nostr ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-surface-variant text-muted-foreground cursor-not-allowed"),
      onClick: async () => {
        try {
          if (window.nostr) {
            const pubkey = await window.nostr.getPublicKey();
            store.setNostrPubkey(pubkey);
            nostr.fetchProfile(pubkey);
          }
        } catch {}
      },
      disabled: !window.nostr
    }, createElement("span", { className: "material-symbols-rounded text-lg" }, "key"), window.nostr ? "Connect Nostr Extension" : "No Nostr extension detected"), createElement("p", { className: "text-xs text-muted-foreground/50 mt-4" }, "Supported extensions: nos2x, Alby, Flamingo, etc."));
  }
  return createElement("div", { className: "max-w-md mx-auto px-6 py-10" }, createElement("div", { className: "flex flex-col items-center mb-8" }, profile?.picture ? createElement("img", {
    src: profile.picture,
    className: "size-20 rounded-full object-cover mb-4 ring-2 ring-primary/30",
    onError: (e) => {
      e.target.style.display = "none";
    }
  }) : createElement("div", {
    className: "size-20 rounded-full bg-surface-variant flex items-center justify-center mb-4 text-2xl font-bold text-on-surface-variant"
  }, displayName ? displayName.charAt(0).toUpperCase() : "?"), createElement("h2", { className: "text-lg font-semibold text-foreground" }, displayName || "Anonymous"), profile?.nip05 ? createElement("p", { className: "text-sm text-primary mt-0.5" }, profile.nip05) : null, createElement("div", { className: "flex items-center gap-1.5 mt-1" }, createElement("div", { className: "size-2 rounded-full bg-online" }), createElement("span", { className: "text-xs text-muted-foreground" }, "Connected"))), createElement("div", {
    className: "rounded-lg border border-border/50 bg-surface-high/30 p-3 mb-4 cursor-pointer hover:bg-surface-high/50 transition-colors",
    title: "Click to copy",
    onClick: () => navigator.clipboard?.writeText(state.nostrPubkey)
  }, createElement("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider mb-1" }, "Public Key"), createElement("p", { className: "text-xs text-foreground font-mono break-all leading-relaxed" }, state.nostrPubkey)), profile?.about ? createElement("div", { className: "rounded-lg border border-border/50 bg-surface-high/30 p-3 mb-4" }, createElement("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider mb-1" }, "About"), createElement("p", { className: "text-sm text-foreground leading-relaxed" }, profile.about)) : null, createElement("p", { className: "text-[10px] text-muted-foreground/25 font-mono select-none text-center mt-8" }, "\uD80C\uDF4A\uD80C\uDEFC\uD80C\uDD8F\uD80C\uDEFC\uD80C\uDF4A"));
}
function HomeSidebar() {
  const state = store.getState();
  const sidebarWidth = state.sidebarWidth;
  function NavBtn({ id, icon, label }) {
    const active = _homeTab === id;
    return createElement("button", {
      className: cn("flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer", active ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"),
      onClick: () => {
        _homeTab = id;
        store["notify"]();
      }
    }, createElement("span", { className: "material-symbols-rounded text-base flex-shrink-0" }, icon), label);
  }
  return createElement("div", {
    className: "flex-shrink-0 border-r border-border overflow-y-auto bg-surface-high flex flex-col",
    style: { width: `${sidebarWidth}px` }
  }, createElement("div", { className: "flex items-center h-12 px-4 flex-shrink-0 border-b border-border gap-2" }, createElement("h2", { className: "text-sm font-semibold text-on-surface flex-1" }, "Hyphae")), createElement("div", { className: "p-2 space-y-0.5 flex-1" }, createElement(NavBtn, { id: "lander", icon: "home", label: "Home" }), createElement(NavBtn, { id: "profile", icon: "person", label: "Profile" })));
}
function HomePage() {
  const state = store.getState();
  return createElement("div", { className: "flex flex-1 min-w-0 overflow-hidden" }, state.sidebarOpen ? createElement(HomeSidebar, null) : null, createElement("div", { className: "flex-1 overflow-y-auto" }, _homeTab === "lander" ? createElement(LanderContent, null) : createElement(ProfileContent, null)));
}

// node_modules/trystero/src/utils.js
var { floor, random, sin } = Math;
var libName = "Trystero";
var alloc = (n, f) => Array(n).fill().map(f);
var charSet = "0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
var genId = (n) => alloc(n, () => charSet[floor(random() * charSet.length)]).join("");
var selfId = genId(20);
var all = Promise.all.bind(Promise);
var isBrowser = typeof window !== "undefined";
var { entries, fromEntries, keys: keys2 } = Object;
var noOp = () => {};
var mkErr = (msg) => new Error(`${libName}: ${msg}`);
var encoder = new TextEncoder;
var decoder = new TextDecoder;
var encodeBytes = (txt) => encoder.encode(txt);
var decodeBytes = (buffer) => decoder.decode(buffer);
var topicPath = (...parts) => parts.join("@");
var shuffle = (xs, seed) => {
  const a = [...xs];
  const rand = () => {
    const x = sin(seed++) * 1e4;
    return x - floor(x);
  };
  let i = a.length;
  while (i) {
    const j = floor(rand() * i--);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
var getRelays = (config, defaults, defaultN, deriveFromAppId) => {
  const relayUrls = config.relayUrls || (deriveFromAppId ? shuffle(defaults, strToNum(config.appId)) : defaults);
  return relayUrls.slice(0, config.relayUrls ? config.relayUrls.length : config.relayRedundancy || defaultN);
};
var toJson = JSON.stringify;
var fromJson = JSON.parse;
var strToNum = (str, limit = Number.MAX_SAFE_INTEGER) => str.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % limit;
var defaultRetryMs = 3333;
var socketRetryPeriods = {};
var reconnectionLockingPromise = null;
var resolver = null;
var pauseRelayReconnection = () => {
  if (!reconnectionLockingPromise) {
    reconnectionLockingPromise = new Promise((resolve) => {
      resolver = resolve;
    }).finally(() => {
      resolver = null;
      reconnectionLockingPromise = null;
    });
  }
};
var resumeRelayReconnection = () => resolver?.();
var makeSocket = (url, onMessage) => {
  const client = {};
  const init = () => {
    const socket2 = new WebSocket(url);
    socket2.onclose = () => {
      if (reconnectionLockingPromise) {
        reconnectionLockingPromise.then(init);
        return;
      }
      socketRetryPeriods[url] ??= defaultRetryMs;
      setTimeout(init, socketRetryPeriods[url]);
      socketRetryPeriods[url] *= 2;
    };
    socket2.onmessage = (e) => onMessage(e.data);
    client.socket = socket2;
    client.url = socket2.url;
    client.ready = new Promise((res) => socket2.onopen = () => {
      res(client);
      socketRetryPeriods[url] = defaultRetryMs;
    });
    client.send = (data) => {
      if (socket2.readyState === 1) {
        socket2.send(data);
      }
    };
  };
  init();
  return client;
};
var socketGetter = (clientMap) => () => fromEntries(entries(clientMap).map(([url, client]) => [url, client.socket]));
var watchOnline = () => {
  if (isBrowser) {
    const controller = new AbortController;
    addEventListener("online", resumeRelayReconnection, {
      signal: controller.signal
    });
    addEventListener("offline", pauseRelayReconnection, {
      signal: controller.signal
    });
    return () => controller.abort();
  }
  return noOp;
};

// node_modules/trystero/src/crypto.js
var algo = "AES-GCM";
var strToSha1 = {};
var pack = (buff) => btoa(String.fromCharCode.apply(null, new Uint8Array(buff)));
var unpack = (packed) => {
  const str = atob(packed);
  return new Uint8Array(str.length).map((_, i) => str.charCodeAt(i)).buffer;
};
var hashWith = async (algo2, str) => new Uint8Array(await crypto.subtle.digest(algo2, encodeBytes(str)));
var sha1 = async (str) => strToSha1[str] ||= Array.from(await hashWith("SHA-1", str)).map((b) => b.toString(36)).join("");
var genKey = async (secret, appId, roomId) => crypto.subtle.importKey("raw", await crypto.subtle.digest({ name: "SHA-256" }, encodeBytes(`${secret}:${appId}:${roomId}`)), { name: algo }, false, ["encrypt", "decrypt"]);
var joinChar = "$";
var ivJoinChar = ",";
var encrypt = async (keyP, plaintext) => {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  return iv.join(ivJoinChar) + joinChar + pack(await crypto.subtle.encrypt({ name: algo, iv }, await keyP, encodeBytes(plaintext)));
};
var decrypt = async (keyP, raw) => {
  const [iv, c] = raw.split(joinChar);
  return decodeBytes(await crypto.subtle.decrypt({ name: algo, iv: new Uint8Array(iv.split(ivJoinChar)) }, await keyP, unpack(c)));
};

// node_modules/trystero/src/peer.js
var iceTimeout = 5000;
var iceStateEvent = "icegatheringstatechange";
var offerType = "offer";
var answerType = "answer";
var peer_default = (initiator, { rtcConfig, rtcPolyfill, turnConfig }) => {
  const pc = new (rtcPolyfill || RTCPeerConnection)({
    iceServers: defaultIceServers.concat(turnConfig || []),
    ...rtcConfig
  });
  const handlers = {};
  let makingOffer = false;
  let isSettingRemoteAnswerPending = false;
  let dataChannel = null;
  const setupDataChannel = (channel) => {
    channel.binaryType = "arraybuffer";
    channel.bufferedAmountLowThreshold = 65535;
    channel.onmessage = (e) => handlers.data?.(e.data);
    channel.onopen = () => handlers.connect?.();
    channel.onclose = () => handlers.close?.();
    channel.onerror = (err) => handlers.error?.(err);
  };
  const waitForIceGathering = (pc2) => Promise.race([
    new Promise((res) => {
      const checkState = () => {
        if (pc2.iceGatheringState === "complete") {
          pc2.removeEventListener(iceStateEvent, checkState);
          res();
        }
      };
      pc2.addEventListener(iceStateEvent, checkState);
      checkState();
    }),
    new Promise((res) => setTimeout(res, iceTimeout))
  ]).then(() => ({
    type: pc2.localDescription.type,
    sdp: pc2.localDescription.sdp.replace(/a=ice-options:trickle\s\n/g, "")
  }));
  if (initiator) {
    dataChannel = pc.createDataChannel("data");
    setupDataChannel(dataChannel);
  } else {
    pc.ondatachannel = ({ channel }) => {
      dataChannel = channel;
      setupDataChannel(channel);
    };
  }
  pc.onnegotiationneeded = async () => {
    try {
      makingOffer = true;
      await pc.setLocalDescription();
      const offer = await waitForIceGathering(pc);
      handlers.signal?.(offer);
    } catch (err) {
      handlers.error?.(err);
    } finally {
      makingOffer = false;
    }
  };
  pc.onconnectionstatechange = () => {
    if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
      handlers.close?.();
    }
  };
  pc.ontrack = (e) => {
    handlers.track?.(e.track, e.streams[0]);
    handlers.stream?.(e.streams[0]);
  };
  pc.onremovestream = (e) => handlers.stream?.(e.stream);
  if (initiator) {
    if (!pc.canTrickleIceCandidates) {
      pc.onnegotiationneeded();
    }
  }
  return {
    created: Date.now(),
    connection: pc,
    get channel() {
      return dataChannel;
    },
    get isDead() {
      return pc.connectionState === "closed";
    },
    async signal(sdp) {
      if (dataChannel?.readyState === "open" && !sdp.sdp?.includes("a=rtpmap")) {
        return;
      }
      try {
        if (sdp.type === offerType) {
          if (makingOffer || pc.signalingState !== "stable" && !isSettingRemoteAnswerPending) {
            if (initiator) {
              return;
            }
            await all([
              pc.setLocalDescription({ type: "rollback" }),
              pc.setRemoteDescription(sdp)
            ]);
          } else {
            await pc.setRemoteDescription(sdp);
          }
          await pc.setLocalDescription();
          const answer = await waitForIceGathering(pc);
          handlers.signal?.(answer);
          return answer;
        } else if (sdp.type === answerType) {
          isSettingRemoteAnswerPending = true;
          try {
            await pc.setRemoteDescription(sdp);
          } finally {
            isSettingRemoteAnswerPending = false;
          }
        }
      } catch (err) {
        handlers.error?.(err);
      }
    },
    sendData: (data) => dataChannel.send(data),
    destroy: () => {
      dataChannel?.close();
      pc.close();
      makingOffer = false;
      isSettingRemoteAnswerPending = false;
    },
    setHandlers: (newHandlers) => Object.assign(handlers, newHandlers),
    offerPromise: initiator ? new Promise((res) => handlers.signal = (sdp) => {
      if (sdp.type === offerType) {
        res(sdp);
      }
    }) : Promise.resolve(),
    addStream: (stream) => stream.getTracks().forEach((track) => pc.addTrack(track, stream)),
    removeStream: (stream) => pc.getSenders().filter((sender) => stream.getTracks().includes(sender.track)).forEach((sender) => pc.removeTrack(sender)),
    addTrack: (track, stream) => pc.addTrack(track, stream),
    removeTrack: (track) => {
      const sender = pc.getSenders().find((s) => s.track === track);
      if (sender) {
        pc.removeTrack(sender);
      }
    },
    replaceTrack: (oldTrack, newTrack) => {
      const sender = pc.getSenders().find((s) => s.track === oldTrack);
      if (sender) {
        return sender.replaceTrack(newTrack);
      }
    }
  };
};
var defaultIceServers = [
  ...alloc(3, (_, i) => `stun:stun${i || ""}.l.google.com:19302`),
  "stun:stun.cloudflare.com:3478"
].map((url) => ({ urls: url }));

// node_modules/trystero/src/room.js
var TypedArray = Object.getPrototypeOf(Uint8Array);
var typeByteLimit = 12;
var typeIndex = 0;
var nonceIndex = typeIndex + typeByteLimit;
var tagIndex = nonceIndex + 1;
var progressIndex = tagIndex + 1;
var payloadIndex = progressIndex + 1;
var chunkSize = 16 * 2 ** 10 - payloadIndex;
var oneByteMax = 255;
var buffLowEvent = "bufferedamountlow";
var internalNs = (ns) => "@_" + ns;
var room_default = (onPeer, onPeerLeave, onSelfLeave) => {
  const peerMap = {};
  const actions = {};
  const actionsCache = {};
  const pendingTransmissions = {};
  const pendingPongs = {};
  const pendingStreamMetas = {};
  const pendingTrackMetas = {};
  const listeners = {
    onPeerJoin: noOp,
    onPeerLeave: noOp,
    onPeerStream: noOp,
    onPeerTrack: noOp
  };
  const iterate = (targets, f) => (targets ? Array.isArray(targets) ? targets : [targets] : keys2(peerMap)).flatMap((id) => {
    const peer = peerMap[id];
    if (!peer) {
      console.warn(`${libName}: no peer with id ${id} found`);
      return [];
    }
    return f(id, peer);
  });
  const exitPeer = (id) => {
    if (!peerMap[id]) {
      return;
    }
    peerMap[id].destroy();
    delete peerMap[id];
    delete pendingTransmissions[id];
    delete pendingPongs[id];
    listeners.onPeerLeave(id);
    onPeerLeave(id);
  };
  const makeAction = (type) => {
    if (actions[type]) {
      return actionsCache[type];
    }
    if (!type) {
      throw mkErr("action type argument is required");
    }
    const typeBytes = encodeBytes(type);
    if (typeBytes.byteLength > typeByteLimit) {
      throw mkErr(`action type string "${type}" (${typeBytes.byteLength}b) exceeds ` + `byte limit (${typeByteLimit}). Hint: choose a shorter name.`);
    }
    const typeBytesPadded = new Uint8Array(typeByteLimit);
    typeBytesPadded.set(typeBytes);
    let nonce = 0;
    actions[type] = {
      onComplete: noOp,
      onProgress: noOp,
      setOnComplete: (f) => actions[type] = { ...actions[type], onComplete: f },
      setOnProgress: (f) => actions[type] = { ...actions[type], onProgress: f },
      send: async (data, targets, meta, onProgress) => {
        if (meta && typeof meta !== "object") {
          throw mkErr("action meta argument must be an object");
        }
        const dataType = typeof data;
        if (dataType === "undefined") {
          throw mkErr("action data cannot be undefined");
        }
        const isJson = dataType !== "string";
        const isBlob = data instanceof Blob;
        const isBinary = isBlob || data instanceof ArrayBuffer || data instanceof TypedArray;
        if (meta && !isBinary) {
          throw mkErr("action meta argument can only be used with binary data");
        }
        const buffer = isBinary ? new Uint8Array(isBlob ? await data.arrayBuffer() : data) : encodeBytes(isJson ? toJson(data) : data);
        const metaEncoded = meta ? encodeBytes(toJson(meta)) : null;
        const chunkTotal = Math.ceil(buffer.byteLength / chunkSize) + (meta ? 1 : 0) || 1;
        const chunks = alloc(chunkTotal, (_, i) => {
          const isLast = i === chunkTotal - 1;
          const isMeta = meta && i === 0;
          const chunk = new Uint8Array(payloadIndex + (isMeta ? metaEncoded.byteLength : isLast ? buffer.byteLength - chunkSize * (chunkTotal - (meta ? 2 : 1)) : chunkSize));
          chunk.set(typeBytesPadded);
          chunk.set([nonce], nonceIndex);
          chunk.set([isLast | isMeta << 1 | isBinary << 2 | isJson << 3], tagIndex);
          chunk.set([Math.round((i + 1) / chunkTotal * oneByteMax)], progressIndex);
          chunk.set(meta ? isMeta ? metaEncoded : buffer.subarray((i - 1) * chunkSize, i * chunkSize) : buffer.subarray(i * chunkSize, (i + 1) * chunkSize), payloadIndex);
          return chunk;
        });
        nonce = nonce + 1 & oneByteMax;
        return all(iterate(targets, async (id, peer) => {
          const { channel } = peer;
          let chunkN = 0;
          while (chunkN < chunkTotal) {
            const chunk = chunks[chunkN];
            if (channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
              await new Promise((res) => {
                const next = () => {
                  channel.removeEventListener(buffLowEvent, next);
                  res();
                };
                channel.addEventListener(buffLowEvent, next);
              });
            }
            if (!peerMap[id]) {
              break;
            }
            peer.sendData(chunk);
            chunkN++;
            onProgress?.(chunk[progressIndex] / oneByteMax, id, meta);
          }
        }));
      }
    };
    return actionsCache[type] ||= [
      actions[type].send,
      actions[type].setOnComplete,
      actions[type].setOnProgress
    ];
  };
  const handleData = (id, data) => {
    const buffer = new Uint8Array(data);
    const type = decodeBytes(buffer.subarray(typeIndex, nonceIndex)).replaceAll("\x00", "");
    const [nonce] = buffer.subarray(nonceIndex, tagIndex);
    const [tag] = buffer.subarray(tagIndex, progressIndex);
    const [progress] = buffer.subarray(progressIndex, payloadIndex);
    const payload = buffer.subarray(payloadIndex);
    const isLast = !!(tag & 1);
    const isMeta = !!(tag & 1 << 1);
    const isBinary = !!(tag & 1 << 2);
    const isJson = !!(tag & 1 << 3);
    if (!actions[type]) {
      console.warn(`${libName}: received message with unregistered type (${type})`);
      return;
    }
    pendingTransmissions[id] ||= {};
    pendingTransmissions[id][type] ||= {};
    const target = pendingTransmissions[id][type][nonce] ||= { chunks: [] };
    if (isMeta) {
      target.meta = fromJson(decodeBytes(payload));
    } else {
      target.chunks.push(payload);
    }
    actions[type].onProgress(progress / oneByteMax, id, target.meta);
    if (!isLast) {
      return;
    }
    const full = new Uint8Array(target.chunks.reduce((a, c) => a + c.byteLength, 0));
    target.chunks.reduce((a, c) => {
      full.set(c, a);
      return a + c.byteLength;
    }, 0);
    delete pendingTransmissions[id][type][nonce];
    if (isBinary) {
      actions[type].onComplete(full, id, target.meta);
    } else {
      const text = decodeBytes(full);
      actions[type].onComplete(isJson ? fromJson(text) : text, id);
    }
  };
  const leave = async () => {
    await sendLeave("");
    await new Promise((res) => setTimeout(res, 99));
    entries(peerMap).forEach(([id, peer]) => {
      peer.destroy();
      delete peerMap[id];
    });
    onSelfLeave();
  };
  const [sendPing, getPing] = makeAction(internalNs("ping"));
  const [sendPong, getPong] = makeAction(internalNs("pong"));
  const [sendSignal, getSignal] = makeAction(internalNs("signal"));
  const [sendStreamMeta, getStreamMeta] = makeAction(internalNs("stream"));
  const [sendTrackMeta, getTrackMeta] = makeAction(internalNs("track"));
  const [sendLeave, getLeave] = makeAction(internalNs("leave"));
  onPeer((peer, id) => {
    if (peerMap[id]) {
      return;
    }
    peerMap[id] = peer;
    peer.setHandlers({
      data: (d) => handleData(id, d),
      stream: (stream) => {
        listeners.onPeerStream(stream, id, pendingStreamMetas[id]);
        delete pendingStreamMetas[id];
      },
      track: (track, stream) => {
        listeners.onPeerTrack(track, stream, id, pendingTrackMetas[id]);
        delete pendingTrackMetas[id];
      },
      signal: (sdp) => sendSignal(sdp, id),
      close: () => exitPeer(id),
      error: (err) => {
        console.error(err);
        exitPeer(id);
      }
    });
    listeners.onPeerJoin(id);
  });
  getPing((_, id) => sendPong("", id));
  getPong((_, id) => {
    pendingPongs[id]?.();
    delete pendingPongs[id];
  });
  getSignal((sdp, id) => peerMap[id]?.signal(sdp));
  getStreamMeta((meta, id) => pendingStreamMetas[id] = meta);
  getTrackMeta((meta, id) => pendingTrackMetas[id] = meta);
  getLeave((_, id) => exitPeer(id));
  if (isBrowser) {
    addEventListener("beforeunload", leave);
  }
  return {
    makeAction,
    leave,
    ping: async (id) => {
      if (!id) {
        throw mkErr("ping() must be called with target peer ID");
      }
      const start = Date.now();
      sendPing("", id);
      await new Promise((res) => pendingPongs[id] = res);
      return Date.now() - start;
    },
    getPeers: () => fromEntries(entries(peerMap).map(([id, peer]) => [id, peer.connection])),
    addStream: (stream, targets, meta) => iterate(targets, async (id, peer) => {
      if (meta) {
        await sendStreamMeta(meta, id);
      }
      peer.addStream(stream);
    }),
    removeStream: (stream, targets) => iterate(targets, (_, peer) => peer.removeStream(stream)),
    addTrack: (track, stream, targets, meta) => iterate(targets, async (id, peer) => {
      if (meta) {
        await sendTrackMeta(meta, id);
      }
      peer.addTrack(track, stream);
    }),
    removeTrack: (track, targets) => iterate(targets, (_, peer) => peer.removeTrack(track)),
    replaceTrack: (oldTrack, newTrack, targets, meta) => iterate(targets, async (id, peer) => {
      if (meta) {
        await sendTrackMeta(meta, id);
      }
      peer.replaceTrack(oldTrack, newTrack);
    }),
    onPeerJoin: (f) => listeners.onPeerJoin = f,
    onPeerLeave: (f) => listeners.onPeerLeave = f,
    onPeerStream: (f) => listeners.onPeerStream = f,
    onPeerTrack: (f) => listeners.onPeerTrack = f
  };
};

// node_modules/trystero/src/strategy.js
var poolSize = 20;
var announceIntervalMs = 5333;
var offerTtl = 57333;
var strategy_default = ({ init, subscribe, announce }) => {
  const occupiedRooms = {};
  let didInit = false;
  let initPromises;
  let offerPool;
  let offerCleanupTimer;
  let cleanupWatchOnline;
  return (config, roomId, onJoinError) => {
    const { appId } = config;
    if (occupiedRooms[appId]?.[roomId]) {
      return occupiedRooms[appId][roomId];
    }
    const pendingOffers = {};
    const connectedPeers = {};
    const rootTopicPlaintext = topicPath(libName, appId, roomId);
    const rootTopicP = sha1(rootTopicPlaintext);
    const selfTopicP = sha1(topicPath(rootTopicPlaintext, selfId));
    const key = genKey(config.password || "", appId, roomId);
    const withKey = (f) => async (signal) => ({
      type: signal.type,
      sdp: await f(key, signal.sdp)
    });
    const toPlain = withKey(decrypt);
    const toCipher = withKey(encrypt);
    const makeOffer = () => peer_default(true, config);
    const connectPeer = (peer, peerId, relayId) => {
      if (connectedPeers[peerId]) {
        if (connectedPeers[peerId] !== peer) {
          peer.destroy();
        }
        return;
      }
      connectedPeers[peerId] = peer;
      onPeerConnect(peer, peerId);
      pendingOffers[peerId]?.forEach((peer2, i) => {
        if (i !== relayId) {
          peer2.destroy();
        }
      });
      delete pendingOffers[peerId];
    };
    const disconnectPeer = (peer, peerId) => {
      if (connectedPeers[peerId] === peer) {
        delete connectedPeers[peerId];
      }
    };
    const prunePendingOffer = (peerId, relayId) => {
      if (connectedPeers[peerId]) {
        return;
      }
      const offer = pendingOffers[peerId]?.[relayId];
      if (offer) {
        delete pendingOffers[peerId][relayId];
        offer.destroy();
      }
    };
    const getOffers = (n) => {
      offerPool.push(...alloc(n, makeOffer));
      return all(offerPool.splice(0, n).map((peer) => peer.offerPromise.then(toCipher).then((offer) => ({ peer, offer }))));
    };
    const handleJoinError = (peerId, sdpType) => onJoinError?.({
      error: `incorrect password (${config.password}) when decrypting ${sdpType}`,
      appId,
      peerId,
      roomId
    });
    const handleMessage = (relayId) => async (topic, msg, signalPeer) => {
      const [rootTopic, selfTopic] = await all([rootTopicP, selfTopicP]);
      if (topic !== rootTopic && topic !== selfTopic) {
        return;
      }
      const { peerId, offer, answer, peer } = typeof msg === "string" ? fromJson(msg) : msg;
      if (peerId === selfId || connectedPeers[peerId]) {
        return;
      }
      if (peerId && !offer && !answer) {
        if (pendingOffers[peerId]?.[relayId]) {
          return;
        }
        const [[{ peer: peer2, offer: offer2 }], topic2] = await all([
          getOffers(1),
          sha1(topicPath(rootTopicPlaintext, peerId))
        ]);
        pendingOffers[peerId] ||= [];
        pendingOffers[peerId][relayId] = peer2;
        setTimeout(() => prunePendingOffer(peerId, relayId), announceIntervals[relayId] * 0.9);
        peer2.setHandlers({
          connect: () => connectPeer(peer2, peerId, relayId),
          close: () => disconnectPeer(peer2, peerId)
        });
        signalPeer(topic2, toJson({ peerId: selfId, offer: offer2 }));
      } else if (offer) {
        const myOffer = pendingOffers[peerId]?.[relayId];
        if (myOffer && selfId > peerId) {
          return;
        }
        const peer2 = peer_default(false, config);
        peer2.setHandlers({
          connect: () => connectPeer(peer2, peerId, relayId),
          close: () => disconnectPeer(peer2, peerId)
        });
        let plainOffer;
        try {
          plainOffer = await toPlain(offer);
        } catch {
          handleJoinError(peerId, "offer");
          return;
        }
        if (peer2.isDead) {
          return;
        }
        const [topic2, answer2] = await all([
          sha1(topicPath(rootTopicPlaintext, peerId)),
          peer2.signal(plainOffer)
        ]);
        signalPeer(topic2, toJson({ peerId: selfId, answer: await toCipher(answer2) }));
      } else if (answer) {
        let plainAnswer;
        try {
          plainAnswer = await toPlain(answer);
        } catch (e) {
          handleJoinError(peerId, "answer");
          return;
        }
        if (peer) {
          peer.setHandlers({
            connect: () => connectPeer(peer, peerId, relayId),
            close: () => disconnectPeer(peer, peerId)
          });
          peer.signal(plainAnswer);
        } else {
          const peer2 = pendingOffers[peerId]?.[relayId];
          if (peer2 && !peer2.isDead) {
            peer2.signal(plainAnswer);
          }
        }
      }
    };
    if (!config) {
      throw mkErr("requires a config map as the first argument");
    }
    if (!appId && !config.firebaseApp) {
      throw mkErr("config map is missing appId field");
    }
    if (!roomId) {
      throw mkErr("roomId argument required");
    }
    if (!didInit) {
      const initRes = init(config);
      offerPool = alloc(poolSize, makeOffer);
      initPromises = Array.isArray(initRes) ? initRes : [initRes];
      didInit = true;
      offerCleanupTimer = setInterval(() => offerPool = offerPool.filter((peer) => {
        const shouldLive = Date.now() - peer.created < offerTtl;
        if (!shouldLive) {
          peer.destroy();
        }
        return shouldLive;
      }), offerTtl * 1.03);
      cleanupWatchOnline = config.manualRelayReconnection ? noOp : watchOnline();
    }
    const announceIntervals = initPromises.map(() => announceIntervalMs);
    const announceTimeouts = [];
    const unsubFns = initPromises.map(async (relayP, i) => subscribe(await relayP, await rootTopicP, await selfTopicP, handleMessage(i), getOffers));
    all([rootTopicP, selfTopicP]).then(([rootTopic, selfTopic]) => {
      const queueAnnounce = async (relay2, i) => {
        const ms = await announce(relay2, rootTopic, selfTopic);
        if (typeof ms === "number") {
          announceIntervals[i] = ms;
        }
        announceTimeouts[i] = setTimeout(() => queueAnnounce(relay2, i), announceIntervals[i]);
      };
      unsubFns.forEach(async (didSub, i) => {
        await didSub;
        queueAnnounce(await initPromises[i], i);
      });
    });
    let onPeerConnect = noOp;
    occupiedRooms[appId] ||= {};
    return occupiedRooms[appId][roomId] = room_default((f) => onPeerConnect = f, (id) => delete connectedPeers[id], () => {
      delete occupiedRooms[appId][roomId];
      announceTimeouts.forEach(clearTimeout);
      unsubFns.forEach(async (f) => (await f)());
      clearInterval(offerCleanupTimer);
      cleanupWatchOnline();
      didInit = false;
    });
  };
};

// node_modules/trystero/src/torrent.js
var clients = {};
var topicToInfoHash = {};
var infoHashToTopic = {};
var announceIntervals = {};
var announceFns = {};
var trackerAnnounceMs = {};
var handledOffers = {};
var msgHandlers = {};
var trackerAction = "announce";
var hashLimit = 20;
var offerPoolSize = 10;
var defaultAnnounceMs = 33333;
var maxAnnounceMs = 120333;
var defaultRedundancy = 3;
var getInfoHash = async (topic) => {
  if (topicToInfoHash[topic]) {
    return topicToInfoHash[topic];
  }
  const hash = (await sha1(topic)).slice(0, hashLimit);
  topicToInfoHash[topic] = hash;
  infoHashToTopic[hash] = topic;
  return hash;
};
var send = async (client, topic, payload) => client.send(toJson({
  action: trackerAction,
  info_hash: await getInfoHash(topic),
  peer_id: selfId,
  ...payload
}));
var warn = (url, msg, didFail) => console.warn(`${libName}: torrent tracker ${didFail ? "failure" : "warning"} from ${url} - ${msg}`);
var joinRoom = strategy_default({
  init: (config) => getRelays(config, defaultRelayUrls, defaultRedundancy).map((rawUrl) => {
    const client = makeSocket(rawUrl, (rawData) => {
      const data = fromJson(rawData);
      const errMsg = data["failure reason"];
      const warnMsg = data["warning message"];
      const { interval } = data;
      const topic = infoHashToTopic[data.info_hash];
      if (errMsg) {
        warn(url, errMsg, true);
        return;
      }
      if (warnMsg) {
        warn(url, warnMsg);
      }
      if (interval && interval * 1000 > trackerAnnounceMs[url] && announceFns[url][topic]) {
        const int = Math.min(interval * 1000, maxAnnounceMs);
        clearInterval(announceIntervals[url][topic]);
        trackerAnnounceMs[url] = int;
        announceIntervals[url][topic] = setInterval(announceFns[url][topic], int);
      }
      if (handledOffers[data.offer_id]) {
        return;
      }
      if (data.offer || data.answer) {
        handledOffers[data.offer_id] = true;
        msgHandlers[url][topic]?.(data);
      }
    });
    const { url } = client;
    clients[url] = client;
    msgHandlers[url] = {};
    return client.ready;
  }),
  subscribe: (client, rootTopic, _, onMessage, getOffers) => {
    const { url } = client;
    const announce = async () => {
      const offers = fromEntries((await getOffers(offerPoolSize)).map((peerAndOffer) => [
        genId(hashLimit),
        peerAndOffer
      ]));
      msgHandlers[client.url][rootTopic] = (data) => {
        if (data.offer) {
          onMessage(rootTopic, { offer: data.offer, peerId: data.peer_id }, (_2, signal) => send(client, rootTopic, {
            answer: fromJson(signal).answer,
            offer_id: data.offer_id,
            to_peer_id: data.peer_id
          }));
        } else if (data.answer) {
          const offer = offers[data.offer_id];
          if (offer) {
            onMessage(rootTopic, {
              answer: data.answer,
              peerId: data.peer_id,
              peer: offer.peer
            });
          }
        }
      };
      send(client, rootTopic, {
        numwant: offerPoolSize,
        offers: entries(offers).map(([id, { offer }]) => ({ offer_id: id, offer }))
      });
    };
    trackerAnnounceMs[url] = defaultAnnounceMs;
    announceFns[url] ||= {};
    announceFns[url][rootTopic] = announce;
    announceIntervals[url] ||= {};
    announceIntervals[url][rootTopic] = setInterval(announce, trackerAnnounceMs[url]);
    announce();
    return () => {
      clearInterval(announceIntervals[url][rootTopic]);
      delete msgHandlers[url][rootTopic];
      delete announceFns[url][rootTopic];
    };
  },
  announce: (client) => trackerAnnounceMs[client.url]
});
var getRelaySockets = socketGetter(clients);
var defaultRelayUrls = [
  "tracker.webtorrent.dev",
  "tracker.openwebtorrent.com",
  "tracker.btorrent.xyz",
  "tracker.files.fm:7073/announce"
].map((url) => "wss://" + url);

// src/client/p2p/lib/sleep.ts
var sleep = (milliseconds) => new Promise((res) => {
  setTimeout(res, milliseconds);
});

// src/client/p2p/lib/PeerRoom.ts
var streamQueueAddDelay = 1000;

class PeerRoom {
  room;
  roomConfig;
  peerJoinHandlers = new Map;
  peerLeaveHandlers = new Map;
  peerStreamHandlers = new Map;
  streamQueue = [];
  isProcessingPendingStreams = false;
  processPendingStreams = async () => {
    if (this.isProcessingPendingStreams)
      return;
    this.isProcessingPendingStreams = true;
    while (this.streamQueue.length > 0) {
      await this.streamQueue.shift()?.();
    }
    this.isProcessingPendingStreams = false;
  };
  actions = {};
  constructor(config, roomId) {
    this.roomConfig = config;
    this.room = joinRoom(this.roomConfig, roomId);
    this.room.onPeerJoin((...args) => {
      for (const [, peerJoinHandler] of this.peerJoinHandlers) {
        peerJoinHandler(...args);
      }
    });
    this.room.onPeerLeave((...args) => {
      for (const [, peerLeaveHandler] of this.peerLeaveHandlers) {
        peerLeaveHandler(...args);
      }
    });
    this.room.onPeerStream((...args) => {
      for (const [, peerStreamHandler] of this.peerStreamHandlers) {
        peerStreamHandler(...args);
      }
    });
  }
  flush = () => {
    this.onPeerJoinFlush();
    this.onPeerLeaveFlush();
    this.onPeerStreamFlush();
  };
  leaveRoom = () => {
    this.room.leave();
    this.flush();
  };
  onPeerJoin = (peerHookType, fn) => {
    this.peerJoinHandlers.set(peerHookType, fn);
  };
  onPeerJoinFlush = () => {
    this.peerJoinHandlers = new Map;
  };
  onPeerLeave = (peerHookType, fn) => {
    this.peerLeaveHandlers.set(peerHookType, fn);
  };
  onPeerLeaveFlush = () => {
    this.peerLeaveHandlers = new Map;
  };
  onPeerStream = (peerStreamType, fn) => {
    this.peerStreamHandlers.set(peerStreamType, fn);
  };
  onPeerStreamFlush = () => {
    this.peerStreamHandlers = new Map;
  };
  getPeers = () => {
    const peers = this.room.getPeers();
    return Object.keys(peers);
  };
  getPeerConnectionTypes = async () => {
    const peers = this.room.getPeers();
    const peerConnections = {};
    await Promise.all(Object.entries(peers).map(async ([peerId, rtcPeerConnection]) => {
      const stats = await rtcPeerConnection.getStats();
      let selectedLocalCandidate;
      for (const { type, state, localCandidateId } of stats.values())
        if (type === "candidate-pair" && state === "succeeded" && localCandidateId) {
          selectedLocalCandidate = localCandidateId;
          break;
        }
      const isRelay = !!selectedLocalCandidate && stats.get(selectedLocalCandidate)?.candidateType === "relay";
      peerConnections[peerId] = isRelay ? "RELAY" /* RELAY */ : "DIRECT" /* DIRECT */;
    }));
    return peerConnections;
  };
  makeAction = (peerAction, namespace) => {
    const actionName = `${namespace}.${peerAction}`;
    if (actionName in this.actions) {
      return this.actions[actionName];
    }
    const [sender, receiver, progress] = this.room.makeAction(actionName);
    const eventName = `peerRoomAction.${namespace}.${peerAction}`;
    const eventTarget = new EventTarget;
    let handler = null;
    const connectReceiver = (callback) => {
      handler = (event2) => {
        const { detail: receiverArguments } = event2;
        if (typeof receiverArguments === "undefined") {
          throw new TypeError("Invalid receiver arguments");
        }
        callback(...receiverArguments);
      };
      eventTarget.addEventListener(eventName, handler);
    };
    receiver((...args) => {
      const customEvent = new CustomEvent(eventName, {
        detail: args
      });
      eventTarget.dispatchEvent(customEvent);
    });
    const detatchDispatchReceiver = () => {
      eventTarget.removeEventListener(eventName, handler);
    };
    const action = [
      sender,
      connectReceiver,
      progress,
      detatchDispatchReceiver
    ];
    this.actions[actionName] = action;
    return action;
  };
  addStream = (stream, targetPeers, metadata) => {
    this.streamQueue.push(() => Promise.all(this.room.addStream(stream, targetPeers, metadata)), () => sleep(streamQueueAddDelay));
    this.processPendingStreams();
  };
  removeStream = (stream, targetPeers) => {
    return this.room.removeStream(stream, targetPeers);
  };
}

// src/client/p2p/lib/Time.ts
class Time {
  now = () => {
    return Date.now();
  };
}
var time = new Time;

// src/client/p2p/config/rtcConfig.ts
var rtcConfig = {
  iceServers: [
    {
      urls: ["turn:relay1.expressturn.com:3478"],
      username: "efQUQ79N77B5BNVVKF",
      credential: "N4EAUgpjMzPLrxSS"
    }
  ]
};

// src/client/p2p/config/trackerUrls.ts
var trackerUrls = [];
if (!trackerUrls.length) {
  trackerUrls = undefined;
}

// src/client/p2p/config/messaging.ts
var messageTranscriptSizeLimit = 150;

// node_modules/fun-animal-names/dist/fun-animal-names.esm.js
var animalNames = ["Aardvark", "Albatross", "Alligator", "Alpaca", "Angelfish", "Anglerfish", "Ant", "Anteater", "Antelope", "Antlion", "Ape", "Armadillo", "Asp", "Baboon", "Badger", "Bandicoot", "Barnacle", "Barracuda", "Basilisk", "Bass", "Bat", "Bear", "Beaver", "Bee", "Beetle", "Bird", "Bison", "Blackbird", "Boar", "Bobcat", "Bonobo", "Bug", "Butterfly", "Buzzard", "Camel", "Capybara", "Cardinal", "Caribou", "Cat", "Caterpillar", "Catfish", "Cattle", "Chameleon", "Cheetah", "Chickadee", "Chicken", "Chimpanzee", "Chinchilla", "Chipmunk", "Clam", "Clownfish", "Cobra", "Condor", "Coral", "Cougar", "Coyote", "Crab", "Crane", "Crawdad", "Crayfish", "Cricket", "Crocodile", "Crow", "Cuckoo", "Deer", "Dingo", "Dinosaur", "Dog", "Dolphin", "Donkey", "Dove", "Dragon", "Dragonfly", "Duck", "Eagle", "Earthworm", "Echidna", "Egret", "Elephant", "Elk", "Emu", "Ermine", "Falcon", "Ferret", "Finch", "Firefly", "Fish", "Flamingo", "Fowl", "Fox", "Frog", "Gazelle", "Gecko", "Gerbil", "Gibbon", "Giraffe", "Goat", "Goldfish", "Goose", "Gopher", "Gorilla", "Grasshopper", "Grouse", "Gull", "Guppy", "Hamster", "Hare", "Harrier", "Hawk", "Hedgehog", "Heron", "Hippopotamus", "Horse", "Hummingbird", "Hyena", "Iguana", "Impala", "Jackal", "Jaguar", "Jay", "Jellyfish", "Kangaroo", "Kingfisher", "Kiwi", "Koala", "Koi", "Ladybug", "Lark", "Lemming", "Lemur", "Leopard", "Lion", "Llama", "Lobster", "Loon", "Lynx", "Macaw", "Mackerel", "Mammal", "Manatee", "Mandrill", "Marlin", "Marmoset", "Marmot", "Marsupial", "Mastodon", "Meerkat", "Mink", "Minnow", "Mockingbird", "Mole", "Mongoose", "Monkey", "Moose", "Mosquito", "Mouse", "Mule", "Muskox", "Narwhal", "Ocelot", "Octopus", "Opossum", "Orangutan", "Orca", "Ostrich", "Otter", "Owl", "Ox", "Panda", "Panther", "Parakeet", "Parrot", "Partridge", "Peacock", "Pelican", "Penguin", "Pig", "Pigeon", "Platypus", "Pony", "Porcupine", "Porpoise", "Puffin", "Puma", "Python", "Quail", "Quokka", "Rabbit", "Raccoon", "Raven", "Reindeer", "Rhinoceros", "Roadrunner", "Rooster", "Salamander", "Salmon", "Seahorse", "Shark", "Sheep", "Shrew", "Sloth", "Snail", "Sparrow", "Squid", "Squirrel", "Starfish", "Stingray", "Stoat", "Stork", "Sturgeon", "Swan", "Swift", "Swordfish", "Tapir", "Tarsier", "Tern", "Tiger", "Tortoise", "Toucan", "Turkey", "Turtle", "Tyrannosaurus", "Vole", "Wallaby", "Walrus", "Warbler", "Whale", "Wildcat", "Wolf", "Wolverine", "Wombat", "Woodpecker", "Wren", "Yak", "Zebra"];
var adjectives = ["Adorable", "Adventurous", "Agreeable", "Alert", "Amused", "Attractive", "Average", "Beautiful", "Blushing", "Brainy", "Brave", "Bright", "Busy", "Calm", "Careful", "Cautious", "Charming", "Cheerful", "Clever", "Cloudy", "Colorful", "Comfortable", "Concerned", "Cooperative", "Courageous", "Crazy", "Curious", "Cute", "Delightful", "Determined", "Distinct", "Dizzy", "Elated", "Elegant", "Enchanting", "Encouraging", "Energetic", "Enthusiastic", "Excited", "Exuberant", "Famous", "Fancy", "Fantastic", "Fierce", "Fine", "Friendly", "Funny", "Gentle", "Gifted", "Glamorous", "Gleaming", "Glorious", "Gorgeous", "Graceful", "Handsome", "Happy", "Healthy", "Helpful", "Hilarious", "Important", "Inquisitive", "Jolly", "Joyous", "Kind", "Light", "Lively", "Lovely", "Lucky", "Magnificent", "Mysterious", "Nice", "Nutty", "Outrageous", "Outstanding", "Perfect", "Pleasant", "Poised", "Powerful", "Precious", "Proud", "Puzzled", "Quaint", "Relieved", "Shiny", "Silly", "Sleepy", "Smiling", "Sparkling", "Splendid", "Stormy", "Strange", "Successful", "Tame", "Thankful", "Thoughtful", "Tough", "Victorious", "Vivacious", "Wandering", "Wide-eyed", "Wild", "Witty", "Zany"];
var convertStringToInteger = function convertStringToInteger2(str) {
  return str.split("").reduce(function(acc, _char, i) {
    return acc + _char.charCodeAt(0) * i;
  }, 0);
};
var funAnimalName = function funAnimalName2(stringToHash, _temp) {
  var _ref = _temp === undefined ? {} : _temp, _ref$adjectives = _ref.adjectives, adjectives$1 = _ref$adjectives === undefined ? adjectives : _ref$adjectives, _ref$animalNames = _ref.animalNames, animalNames$1 = _ref$animalNames === undefined ? animalNames : _ref$animalNames;
  var hashNumber = convertStringToInteger(stringToHash);
  var adjective = adjectives$1[hashNumber % adjectives$1.length];
  var adjectiveNumberValue = convertStringToInteger(adjective);
  var animal = animalNames$1[(hashNumber + adjectiveNumberValue) % animalNames$1.length];
  return adjective + " " + animal;
};

// src/client/p2p/lib/getPeerName.ts
var getPeerName = (peerId) => {
  return funAnimalName(peerId);
};
var getDisplayUsername = (peerId, peerList, selfUserId, selfCustomUsername) => {
  if (selfUserId && peerId === selfUserId) {
    return selfCustomUsername || getPeerName(peerId);
  }
  const peer = peerList.find((p3) => p3.userId === peerId);
  if (peer?.customUsername)
    return peer.customUsername;
  return getPeerName(peerId);
};

// src/client/p2p/lib/Audio.ts
class Audio2 {
  audioContext = new AudioContext;
  audioBuffer = null;
  constructor(audioDataUrl) {
    if (audioDataUrl) {
      this.load(audioDataUrl);
    }
  }
  load = async (audioDataUrl) => {
    try {
      const response = await fetch(audioDataUrl);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error(e);
    }
  };
  play = () => {
    if (this.audioBuffer === null) {
      console.error("Audio buffer not available");
      return;
    }
    const audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = this.audioBuffer;
    audioSource.connect(this.audioContext.destination);
    audioSource.start();
  };
}

// src/client/p2p/roomManager.ts
var currentPeerRoom = null;
var sendPeerMetadataFn = null;
var sendPeerMessageFn = null;
var sendMessageTranscriptFn = null;
var sendTypingStatusFn = null;
var typingDebounceTimer = null;
var audioPlayer = null;
var sendAudioChangeFn = null;
var sendVideoChangeFn = null;
var sendScreenShareFn = null;
var sendFileOfferFn = null;
var sendFileDataFn = null;
var sendDirectMessageFn = null;
var incomingFileChunks = {};
var FILE_CHUNK_SIZE = 64 * 1024;
var sendVerificationTokenEncryptedFn = null;
var sendVerificationTokenRawFn = null;
var VERIFICATION_TIMEOUT_MS = 1e4;
async function joinRoom2(roomId, password) {
  const state = p2pStore.getState();
  if (!state.userSettings)
    return;
  leaveRoom();
  const { userId, customUsername, publicKey } = state.userSettings;
  const appId = `${encodeURI(window.location.origin)}_chitchatter`;
  let effectiveRoomId = roomId;
  if (password) {
    effectiveRoomId = await encryption.encodePassword(roomId, password);
  }
  const config = {
    appId,
    relayUrls: trackerUrls,
    password: password ?? roomId,
    relayRedundancy: 4,
    rtcConfig
  };
  const peerRoom = new PeerRoom(config, effectiveRoomId);
  currentPeerRoom = peerRoom;
  p2pStore.setRoomId(roomId);
  if (password)
    p2pStore.setPassword(password);
  p2pStore.setTitle(`Room: ${roomId.slice(0, 8)}…`);
  const namespace = "g" /* GROUP */;
  const [sendMetadata, receiveMetadata, , detachMetadata] = peerRoom.makeAction(3 /* PEER_METADATA */, namespace);
  sendPeerMetadataFn = sendMetadata;
  receiveMetadata(async (metadata, peerId) => {
    const { userId: peerUserId, customUsername: peerCustomUsername, publicKeyString } = metadata;
    let parsedPublicKey;
    try {
      parsedPublicKey = await encryption.parseCryptoKeyString(publicKeyString, 0 /* PUBLIC */);
    } catch (e) {
      console.error("Failed to parse peer public key", e);
      return;
    }
    const currentState = p2pStore.getState();
    const existingIdx = currentState.peerList.findIndex((p3) => p3.peerId === peerId);
    if (existingIdx === -1) {
      const verificationToken = v4_default();
      const newPeer = {
        peerId,
        userId: peerUserId,
        publicKey: parsedPublicKey,
        customUsername: peerCustomUsername,
        audioChannelState: {
          ["microphone" /* MICROPHONE */]: "STOPPED" /* STOPPED */,
          ["screen-share" /* SCREEN_SHARE */]: "STOPPED" /* STOPPED */
        },
        videoState: "STOPPED" /* STOPPED */,
        screenShareState: "NOT_SHARING" /* NOT_SHARING */,
        offeredFileId: null,
        isTypingGroupMessage: false,
        isTypingDirectMessage: false,
        verificationToken,
        encryptedVerificationToken: new ArrayBuffer(0),
        verificationState: 0 /* VERIFYING */,
        verificationTimer: null
      };
      p2pStore.addPeer(newPeer);
      try {
        const encryptedBuffer = await encryption.encryptString(parsedPublicKey, verificationToken);
        const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
        sendVerificationTokenEncryptedFn?.({ encryptedToken: encryptedBase64 }, peerId);
        const timer = setTimeout(() => {
          const s = p2pStore.getState();
          const p3 = s.peerList.find((pp) => pp.peerId === peerId);
          if (p3 && p3.verificationState === 0 /* VERIFYING */) {
            p2pStore.updatePeer(peerId, { verificationState: 1 /* UNVERIFIED */, verificationTimer: null });
          }
        }, VERIFICATION_TIMEOUT_MS);
        p2pStore.updatePeer(peerId, { verificationTimer: timer });
      } catch (e) {
        console.error("Failed to encrypt verification token for peer", peerId, e);
        p2pStore.updatePeer(peerId, { verificationState: 1 /* UNVERIFIED */ });
      }
    } else {
      const oldPeer = currentState.peerList[existingIdx];
      const oldName = oldPeer.customUsername || getPeerName(oldPeer.userId);
      const newName = peerCustomUsername || getPeerName(peerUserId);
      p2pStore.updatePeer(peerId, {
        userId: peerUserId,
        customUsername: peerCustomUsername
      });
      if (oldName !== newName) {
        p2pStore.showAlert(`${oldName} is now ${newName}`);
      }
    }
  });
  const [sendMsg, receiveMsg, , detachMsg] = peerRoom.makeAction(0 /* MESSAGE */, namespace);
  sendPeerMessageFn = sendMsg;
  receiveMsg((message, peerId) => {
    const currentState = p2pStore.getState();
    const newMsg = { ...message, timeReceived: time.now() };
    const trimmed = [...currentState.messageLog, newMsg].slice(-messageTranscriptSizeLimit);
    p2pStore.setMessageLog(trimmed);
    p2pStore.updatePeer(peerId, { isTypingGroupMessage: false });
    const displayName = getDisplayUsername(message.authorId, currentState.peerList, currentState.userSettings?.userId, currentState.userSettings?.customUsername);
    if (currentState.userSettings?.playSoundOnNewMessage && audioPlayer) {
      audioPlayer.play();
    }
    if (document.hidden && currentState.userSettings?.showNotificationOnNewMessage) {
      try {
        new Notification(`${displayName}: ${message.text}`);
      } catch (_) {}
    }
  });
  const [sendTranscript, receiveTranscript, , detachTranscript] = peerRoom.makeAction(2 /* MESSAGE_TRANSCRIPT */, namespace);
  sendMessageTranscriptFn = sendTranscript;
  receiveTranscript((transcript) => {
    const currentState = p2pStore.getState();
    if (currentState.messageLog.length > 0)
      return;
    p2pStore.setMessageLog(transcript.slice(-messageTranscriptSizeLimit));
  });
  const [sendTyping, receiveTyping, , detachTyping] = peerRoom.makeAction(8 /* TYPING_STATUS_CHANGE */, namespace);
  sendTypingStatusFn = sendTyping;
  receiveTyping((status, peerId) => {
    p2pStore.updatePeer(peerId, { isTypingGroupMessage: status.isTyping });
  });
  const [sendAudioChange, receiveAudioChange, , detachAudioChange] = peerRoom.makeAction(4 /* AUDIO_CHANGE */, namespace);
  sendAudioChangeFn = sendAudioChange;
  receiveAudioChange((payload, peerId) => {
    p2pStore.updatePeer(peerId, {
      audioChannelState: {
        ...p2pStore.getState().peerList.find((p3) => p3.peerId === peerId)?.audioChannelState,
        ["microphone" /* MICROPHONE */]: payload.state
      }
    });
  });
  const [sendVideoChange, receiveVideoChange, , detachVideoChange] = peerRoom.makeAction(5 /* VIDEO_CHANGE */, namespace);
  sendVideoChangeFn = sendVideoChange;
  receiveVideoChange((payload, peerId) => {
    p2pStore.updatePeer(peerId, { videoState: payload.state });
  });
  const [sendScreenShare, receiveScreenShare, , detachScreenShare] = peerRoom.makeAction(6 /* SCREEN_SHARE */, namespace);
  sendScreenShareFn = sendScreenShare;
  receiveScreenShare((payload, peerId) => {
    p2pStore.updatePeer(peerId, { screenShareState: payload.state });
    if (payload.state === "NOT_SHARING" /* NOT_SHARING */) {
      p2pStore.removePeerStream(peerId, "SCREEN_SHARE" /* SCREEN_SHARE */);
    }
  });
  const [sendVerifEncrypted, receiveVerifEncrypted, , detachVerifEncrypted] = peerRoom.makeAction(9 /* VERIFICATION_TOKEN_ENCRYPTED */, namespace);
  sendVerificationTokenEncryptedFn = sendVerifEncrypted;
  const [sendVerifRaw, receiveVerifRaw, , detachVerifRaw] = peerRoom.makeAction(10 /* VERIFICATION_TOKEN_RAW */, namespace);
  sendVerificationTokenRawFn = sendVerifRaw;
  receiveVerifEncrypted(async (payload, peerId) => {
    try {
      const currentState = p2pStore.getState();
      const privateKey = currentState.userSettings?.privateKey;
      if (!privateKey)
        return;
      const binaryString = atob(payload.encryptedToken);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0;i < binaryString.length; i++)
        bytes[i] = binaryString.charCodeAt(i);
      const rawToken = await encryption.decryptString(privateKey, bytes.buffer);
      sendVerifRaw({ rawToken }, peerId);
    } catch (e) {
      console.error("Failed to decrypt verification token from peer", peerId, e);
    }
  });
  receiveVerifRaw((payload, peerId) => {
    const currentState = p2pStore.getState();
    const peer = currentState.peerList.find((p3) => p3.peerId === peerId);
    if (!peer)
      return;
    if (peer.verificationTimer) {
      clearTimeout(peer.verificationTimer);
    }
    if (payload.rawToken === peer.verificationToken) {
      p2pStore.updatePeer(peerId, {
        verificationState: 2 /* VERIFIED */,
        verificationTimer: null
      });
    } else {
      p2pStore.updatePeer(peerId, {
        verificationState: 1 /* UNVERIFIED */,
        verificationTimer: null
      });
    }
  });
  const [sendFileOffer, receiveFileOffer, , detachFileOffer] = peerRoom.makeAction(7 /* FILE_OFFER */, namespace);
  sendFileOfferFn = sendFileOffer;
  receiveFileOffer((payload, peerId) => {
    const currentState = p2pStore.getState();
    const peer = currentState.peerList.find((p3) => p3.peerId === peerId);
    const fromName = peer ? peer.customUsername || getDisplayUsername(peer.userId, currentState.peerList, currentState.userSettings?.userId || "", currentState.userSettings?.customUsername || "") : "Someone";
    const offerId = payload.magnetURI;
    const offer = {
      id: offerId,
      fileName: payload.fileName || "file",
      fileSize: payload.fileSize || 0,
      fromPeerId: peerId,
      fromName,
      magnetURI: offerId,
      direction: "received",
      status: "downloading",
      progress: 0
    };
    p2pStore.addFileOffer(offer);
    p2pStore.addSystemMessage(`${fromName} is sending: ${offer.fileName}`);
    incomingFileChunks[offerId] = { chunks: [], received: 0, totalChunks: 0 };
    if (!currentState.isFileTransferOpen)
      p2pStore.toggleFileTransfer();
  });
  const [sendFileData, receiveFileData, , detachFileData] = peerRoom.makeAction(11 /* FILE_DATA */, namespace);
  sendFileDataFn = sendFileData;
  receiveFileData((payload, _peerId) => {
    const { offerId, chunkIndex, totalChunks, data } = payload;
    const buffer = incomingFileChunks[offerId];
    if (!buffer)
      return;
    buffer.totalChunks = totalChunks;
    buffer.chunks[chunkIndex] = data;
    buffer.received++;
    const progress = Math.round(buffer.received / totalChunks * 100);
    p2pStore.updateFileOffer(offerId, { progress, status: "downloading" });
    if (buffer.received === totalChunks) {
      const binaryChunks = buffer.chunks.map((b64) => {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0;i < bin.length; i++)
          bytes[i] = bin.charCodeAt(i);
        return bytes;
      });
      const blob = new Blob(binaryChunks);
      const blobUrl = URL.createObjectURL(blob);
      p2pStore.updateFileOffer(offerId, { status: "complete", progress: 100, blobUrl });
      delete incomingFileChunks[offerId];
    }
  });
  const [sendDm, receiveDm, , detachDm] = peerRoom.makeAction(12 /* DIRECT_MESSAGE */, "dm" /* DIRECT_MESSAGE */);
  sendDirectMessageFn = sendDm;
  receiveDm((message, peerId) => {
    const newMsg = { ...message, timeReceived: time.now() };
    p2pStore.addDirectMessage(peerId, newMsg);
    const currentState = p2pStore.getState();
    if (currentState.userSettings?.playSoundOnNewMessage && audioPlayer) {
      audioPlayer.play();
    }
    if ((document.hidden || currentState.activeDmPeerId !== peerId) && currentState.userSettings?.showNotificationOnNewMessage) {
      const peer = currentState.peerList.find((p3) => p3.peerId === peerId);
      const displayName = peer ? peer.customUsername || getDisplayUsername(peer.userId, currentState.peerList, currentState.userSettings?.userId || "", currentState.userSettings?.customUsername || "") : "Someone";
      try {
        new Notification(`DM from ${displayName}: ${message.text}`);
      } catch (_) {}
    }
  });
  peerRoom.onPeerStream("AUDIO" /* AUDIO */, (stream, peerId, metadata) => {
    const streamType = metadata?.type || "MICROPHONE" /* MICROPHONE */;
    p2pStore.addPeerStream(peerId, stream, streamType);
    if (streamType === "MICROPHONE" /* MICROPHONE */ || streamType === "SCREEN_SHARE" /* SCREEN_SHARE */) {
      const audio = new Audio;
      audio.srcObject = stream;
      audio.autoplay = true;
      audio.play().catch(() => {});
    }
  });
  const currentSettings = p2pStore.getState().userSettings;
  if (currentSettings?.selectedSound) {
    audioPlayer = new Audio2(currentSettings.selectedSound);
  }
  peerRoom.onPeerJoin("NEW_PEER" /* NEW_PEER */, (peerId) => {
    p2pStore.addSystemMessage("Someone has joined the room");
    p2pStore.showAlert("Someone has joined the room", "success");
    (async () => {
      try {
        const currentState = p2pStore.getState();
        if (!currentState.userSettings)
          return;
        const publicKeyString = await encryption.stringifyCryptoKey(currentState.userSettings.publicKey);
        await sendMetadata({
          userId: currentState.userSettings.userId,
          customUsername: currentState.userSettings.customUsername,
          publicKeyString
        }, peerId);
        const receivedMessages = currentState.messageLog.filter(isMessageReceived);
        if (receivedMessages.length > 0) {
          await sendTranscript(receivedMessages, peerId);
        }
      } catch (e) {
        console.error("Error sending metadata to new peer", e);
      }
    })();
  });
  peerRoom.onPeerLeave("NEW_PEER" /* NEW_PEER */, (peerId) => {
    const currentState = p2pStore.getState();
    const peer = currentState.peerList.find((p3) => p3.peerId === peerId);
    const name = peer ? peer.customUsername || getPeerName(peer.userId) : "Someone";
    p2pStore.addSystemMessage(`${name} has left the room`);
    p2pStore.showAlert(`${name} has left the room`, "warning");
    p2pStore.removePeerStreams(peerId);
    p2pStore.removePeer(peerId);
  });
  try {
    const publicKeyString = await encryption.stringifyCryptoKey(publicKey);
    await sendMetadata({ userId, customUsername, publicKeyString });
  } catch (e) {
    console.error("Error broadcasting initial metadata", e);
  }
}
async function sendMessage(text) {
  if (!sendPeerMessageFn)
    return;
  const state = p2pStore.getState();
  if (!state.userSettings)
    return;
  const unsentMessage = {
    authorId: state.userSettings.userId,
    text,
    timeSent: time.now(),
    id: v4_default()
  };
  const withUnsent = [...state.messageLog, unsentMessage].slice(-messageTranscriptSizeLimit);
  p2pStore.setMessageLog(withUnsent);
  await sendPeerMessageFn(unsentMessage);
  const currentState = p2pStore.getState();
  const updatedLog = currentState.messageLog.map((m) => m.id === unsentMessage.id ? { ...m, timeReceived: time.now() } : m);
  p2pStore.setMessageLog(updatedLog);
}
function sendTypingStatus(isTyping) {
  if (!sendTypingStatusFn)
    return;
  const state = p2pStore.getState();
  if (!state.userSettings?.showActiveTypingStatus)
    return;
  sendTypingStatusFn({ isTyping });
}
function handleMessageInputChange() {
  if (!sendTypingStatusFn)
    return;
  const state = p2pStore.getState();
  if (!state.userSettings?.showActiveTypingStatus)
    return;
  sendTypingStatus(true);
  if (typingDebounceTimer)
    clearTimeout(typingDebounceTimer);
  typingDebounceTimer = setTimeout(() => {
    sendTypingStatus(false);
  }, 3000);
}
function leaveRoom() {
  p2pStore.resetMediaState();
  if (currentPeerRoom) {
    currentPeerRoom.leaveRoom();
    currentPeerRoom = null;
  }
  sendPeerMetadataFn = null;
  sendPeerMessageFn = null;
  sendMessageTranscriptFn = null;
  sendTypingStatusFn = null;
  sendAudioChangeFn = null;
  sendVideoChangeFn = null;
  sendScreenShareFn = null;
  sendFileOfferFn = null;
  sendFileDataFn = null;
  sendDirectMessageFn = null;
  for (const key of Object.keys(incomingFileChunks))
    delete incomingFileChunks[key];
  sendVerificationTokenEncryptedFn = null;
  sendVerificationTokenRawFn = null;
  audioPlayer = null;
  if (typingDebounceTimer)
    clearTimeout(typingDebounceTimer);
  p2pStore.setPeerList([]);
  p2pStore.setMessageLog([]);
  p2pStore.setRoomId(undefined);
  p2pStore.setPassword(undefined);
}

// src/client/components/P2PSidebar.tsx
function P2PSidebar() {
  const state = store.getState();
  const p2p = p2pStore.getState();
  return createElement("div", {
    className: "flex flex-col flex-shrink-0 bg-surface-high overflow-hidden",
    style: { width: `${state.sidebarWidth}px` }
  }, createElement("div", {
    className: "flex items-center h-12 px-4 flex-shrink-0 border-b border-border"
  }, createElement("span", { className: "material-symbols-rounded text-lg text-primary mr-2" }, "hub"), createElement("h2", {
    className: "text-sm font-semibold text-on-surface truncate flex-1"
  }, "P2P Chat"), createElement(Button, {
    variant: "ghost",
    size: "icon-sm",
    className: "size-7 text-muted-foreground hover:text-foreground",
    onClick: () => store.openSettings("p2p-profile")
  }, createElement("span", { className: "material-symbols-rounded text-base" }, "settings")), p2p.roomId ? createElement(Button, {
    variant: "ghost",
    size: "icon-sm",
    className: "size-7 text-muted-foreground hover:text-destructive",
    onClick: () => leaveRoom()
  }, createElement("span", { className: "material-symbols-rounded text-base" }, "logout")) : null), createElement("div", {
    className: "flex-1 overflow-y-auto py-1 pb-28"
  }, p2p.roomId ? createElement("div", { className: "px-2 pt-2" }, createElement("div", {
    className: "flex items-center gap-2 px-2 py-1.5 mx-0 rounded-lg bg-accent text-accent-foreground"
  }, createElement("span", { className: "material-symbols-rounded text-lg flex-shrink-0" }, "tag"), createElement("span", { className: "truncate text-sm flex-1 font-medium" }, p2p.roomId), createElement("span", {
    className: "text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0"
  }, `${p2p.peerList.length} peer${p2p.peerList.length !== 1 ? "s" : ""}`))) : null, p2p.joinedRooms.length > 0 ? createElement("div", null, createElement("div", {
    className: "flex items-center gap-1 px-4 pt-4 pb-1"
  }, createElement("span", {
    className: "text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
  }, "Rooms")), ...p2p.joinedRooms.map((room) => createElement("a", {
    key: room.id,
    className: cn("flex items-center gap-2 px-2 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors duration-100", p2p.roomId === room.name ? "bg-accent text-accent-foreground" : "text-on-surface-variant hover:bg-accent/50 hover:text-accent-foreground"),
    onClick: () => {
      if (p2p.roomId !== room.name) {
        joinRoom2(room.name, room.isPrivate ? undefined : undefined);
        p2pStore.addJoinedRoom(room.name, room.isPrivate);
      }
    }
  }, createElement("span", {
    className: "material-symbols-rounded text-lg flex-shrink-0 text-on-surface-variant"
  }, room.isPrivate ? "lock" : "tag"), createElement("span", { className: "truncate text-sm flex-1" }, room.name)))) : null, !p2p.roomId && p2p.joinedRooms.length === 0 ? createElement("div", { className: "px-4 pt-4 text-center" }, createElement("p", { className: "text-xs text-muted-foreground" }, "No rooms yet. Browse or join a room from the main view.")) : null));
}

// src/client/components/P2PChatArea.tsx
function formatTime2(ts) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
function shouldGroup2(msg, prev) {
  if (!prev)
    return false;
  if (prev.authorId !== msg.authorId)
    return false;
  if (isSystemMessage(msg) || isSystemMessage(prev))
    return false;
  if (msg.timeSent - prev.timeSent > 5 * 60000)
    return false;
  return true;
}
function P2PMessageItem({ msg, grouped, displayName }) {
  if (isSystemMessage(msg)) {
    return createElement("div", {
      className: "flex items-center gap-2 px-4 py-0.5"
    }, createElement("span", {
      className: "text-[11px] text-muted-foreground flex-shrink-0"
    }, formatTime2(msg.timeSent)), createElement("span", {
      className: "text-xs italic text-muted-foreground"
    }, msg.text));
  }
  if (grouped) {
    return createElement("div", {
      className: "group flex gap-2 px-4 py-0.5 hover:bg-accent/10 transition-colors"
    }, createElement("span", {
      className: "text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-10 text-right"
    }, formatTime2(msg.timeSent)), createElement("div", { className: "size-8 flex-shrink-0" }), createElement("p", {
      className: "text-sm text-on-surface leading-relaxed break-words min-w-0 flex-1"
    }, msg.text));
  }
  return createElement("div", {
    className: "group flex gap-2 px-4 pt-2 pb-0.5 hover:bg-accent/10 transition-colors"
  }, createElement("span", {
    className: "text-[11px] text-muted-foreground flex-shrink-0 w-10 text-right pt-0.5"
  }, formatTime2(msg.timeSent)), createElement("div", {
    className: "size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0"
  }, displayName.charAt(0).toUpperCase()), createElement("div", { className: "flex-1 min-w-0" }, createElement("span", {
    className: "text-sm font-semibold text-primary cursor-pointer hover:underline"
  }, displayName), createElement("p", {
    className: "text-sm text-on-surface leading-relaxed break-words"
  }, msg.text)));
}
function P2PChatInput() {
  const p2p = p2pStore.getState();
  const placeholder = p2p.roomId ? `Message room` : "Join a room to chat";
  return createElement("div", {
    className: "px-4 pb-4 pt-2"
  }, createElement("form", {
    className: "flex items-center gap-2 rounded-xl border border-input bg-card/50 px-3 py-1.5 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-all",
    onSubmit: (e) => {
      e.preventDefault();
      const input = e.target.elements.p2pmessage;
      const text = input.value.trim();
      if (text && p2p.roomId) {
        sendMessage(text);
        input.value = "";
      }
    }
  }, createElement("input", {
    name: "p2pmessage",
    className: "flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none h-9",
    placeholder,
    autoComplete: "off",
    disabled: !p2p.roomId,
    oninput: () => handleMessageInputChange()
  }), createElement(Button, {
    type: "submit",
    variant: "ghost",
    size: "icon",
    className: "text-primary hover:text-primary flex-shrink-0"
  }, createElement("span", { className: "material-symbols-rounded text-xl" }, "send"))));
}
function P2PChatArea() {
  const p2p = p2pStore.getState();
  const mainState = store.getState();
  if (!p2p.roomId) {
    return createElement("div", {
      className: "flex flex-col flex-1 items-center justify-center text-muted-foreground"
    }, createElement("span", { className: "material-symbols-rounded text-6xl mb-4 opacity-30" }, "hub"), createElement("p", { className: "text-lg" }, "No P2P room active"), createElement("p", { className: "text-sm mt-1" }, "Join or create a room from the sidebar"));
  }
  const messages = p2p.messageLog;
  return createElement("div", {
    className: "flex flex-col flex-1 min-w-0 min-h-0"
  }, createElement("div", {
    className: "flex items-center h-12 px-4 flex-shrink-0 border-b border-border gap-2"
  }, createElement(Button, {
    variant: "ghost",
    size: "icon-sm",
    className: "text-muted-foreground hover:text-foreground lg:hidden",
    onClick: () => store.toggleSidebar()
  }, createElement("span", { className: "material-symbols-rounded text-lg" }, "menu")), createElement("span", {
    className: "material-symbols-rounded text-lg text-primary"
  }, "hub"), createElement("span", {
    className: "text-sm font-semibold text-on-surface"
  }, p2p.roomId), createElement("span", {
    className: "text-xs text-muted-foreground ml-2"
  }, `${p2p.peerList.length} peer${p2p.peerList.length !== 1 ? "s" : ""}`), createElement("div", { className: "flex-1" })), createElement("div", {
    className: "flex-1 overflow-y-auto",
    ref: (el) => {
      if (el)
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
    }
  }, messages.length === 0 ? createElement("div", {
    className: "px-4 pt-8 pb-4 text-center"
  }, createElement("span", { className: "material-symbols-rounded text-4xl text-on-surface-variant/30 mb-2" }, "chat_bubble"), createElement("p", { className: "text-sm text-muted-foreground" }, "Waiting for messages...")) : null, ...messages.map((msg, i) => {
    const prev = messages[i - 1];
    const grouped = shouldGroup2(msg, prev);
    const displayName = isSystemMessage(msg) ? "System" : getDisplayUsername(msg.authorId, p2p.peerList, p2p.userSettings?.userId, p2p.userSettings?.customUsername);
    return createElement(P2PMessageItem, { key: msg.id, msg, grouped, displayName });
  }), createElement("div", { className: "h-2" })), createElement(P2PChatInput, null));
}

// src/client/components/P2PPeerList.tsx
function VerificationBadge({ state }) {
  if (state === 2 /* VERIFIED */) {
    return createElement("span", {
      className: "material-symbols-rounded text-sm text-online",
      title: "Verified"
    }, "verified");
  }
  if (state === 0 /* VERIFYING */) {
    return createElement("span", {
      className: "material-symbols-rounded text-sm text-idle animate-pulse",
      title: "Verifying..."
    }, "pending");
  }
  return createElement("span", {
    className: "material-symbols-rounded text-sm text-muted-foreground",
    title: "Unverified"
  }, "help");
}
function P2PPeerList() {
  const p2p = p2pStore.getState();
  if (!p2p.roomId)
    return null;
  return createElement("div", {
    className: "w-[220px] flex-shrink-0 bg-surface-low overflow-y-auto border-l border-border"
  }, createElement("div", {
    className: "flex items-center gap-1.5 px-4 pt-3 pb-1"
  }, createElement("span", { className: "material-symbols-rounded text-sm text-primary" }, "hub"), createElement("span", {
    className: "text-[11px] font-medium text-on-surface-variant"
  }, `${p2p.peerList.length} peer${p2p.peerList.length !== 1 ? "s" : ""} connected`)), p2p.userSettings ? createElement("div", { className: "mb-1" }, createElement("div", {
    className: "px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
  }, "You"), createElement("div", {
    className: "flex items-center gap-2 px-3 py-1 mx-2 rounded-lg bg-accent/20"
  }, createElement("div", {
    className: "size-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0"
  }, (p2p.userSettings.customUsername || "U").charAt(0).toUpperCase()), createElement("span", {
    className: "text-sm truncate text-on-surface"
  }, p2p.userSettings.customUsername || "Anonymous"))) : null, p2p.peerList.length > 0 ? createElement("div", { className: "mb-1" }, createElement("div", {
    className: "px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant"
  }, `Peers — ${p2p.peerList.length}`), ...p2p.peerList.map((peer) => {
    const displayName = peer.customUsername || getDisplayUsername(peer.userId, p2p.peerList, p2p.userSettings?.userId, p2p.userSettings?.customUsername);
    return createElement("div", {
      key: peer.peerId,
      className: cn("flex items-center gap-2 px-3 py-1 mx-2 rounded-lg cursor-pointer transition-colors", "hover:bg-accent/40"),
      onClick: () => p2pStore.openDm(peer.peerId),
      title: `Click to DM ${displayName}`
    }, createElement("div", {
      className: "size-7 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-semibold text-on-surface-variant flex-shrink-0"
    }, displayName.charAt(0).toUpperCase()), createElement("span", {
      className: "text-sm truncate flex-1 text-on-surface"
    }, displayName), createElement(VerificationBadge, { state: peer.verificationState }), p2p.dmUnreadCounts[peer.peerId] ? createElement("span", {
      className: "min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0"
    }, String(p2p.dmUnreadCounts[peer.peerId])) : null);
  })) : null, createElement("div", { className: "h-4" }));
}

// src/client/p2p/config/communityRooms.ts
var communityRoomNames = [
  "buy-and-sell",
  "crypto",
  "hacking",
  "leaks",
  "news",
  "organize",
  "politics",
  "resist"
];

// src/client/components/App.tsx
function ResizeHandle() {
  return createElement("div", {
    className: "relative flex-shrink-0 z-10",
    style: { width: "0px" }
  }, createElement("div", {
    className: "absolute inset-y-0 -left-[3px] w-[6px] cursor-col-resize hover:bg-ring/40 active:bg-ring/60 transition-colors duration-150",
    onMouseDown: (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = store.getState().sidebarWidth;
      const onMove = (ev) => {
        store.setSidebarWidth(startWidth + (ev.clientX - startX));
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
  }));
}
function ModeTabBar() {
  const state = store.getState();
  const p2p = p2pStore.getState();
  function Tab({ mode, label, icon, badge }) {
    const active = state.appMode === mode;
    return createElement("button", {
      className: cn("flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"),
      onClick: () => store.setAppMode(mode)
    }, createElement("span", { className: "material-symbols-rounded text-base" }, icon), label, badge && badge > 0 ? createElement("span", {
      className: "ml-1 min-w-[18px] h-[18px] rounded-full bg-online text-white text-[10px] font-bold flex items-center justify-center px-1"
    }, String(badge)) : null);
  }
  const connectedCount = state.networks.filter((n) => n.connected).length;
  const peerCount = p2p.roomId ? p2p.peerList.length : 0;
  return createElement("div", {
    className: "flex items-center gap-1 px-3 py-1.5 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0"
  }, createElement(Tab, { mode: "home", label: "Home", icon: "home" }), createElement(Tab, { mode: "irc", label: "IRC", icon: "dns", badge: connectedCount }), createElement(Tab, { mode: "p2p", label: "P2P Chat", icon: "hub", badge: peerCount }));
}
function IrcContent() {
  const state = store.getState();
  if (state.networks.length === 0 && !state.connectFormOpen) {
    return createElement("div", {
      className: "flex flex-1 min-w-0 items-center justify-center bg-surface-low"
    }, createElement("div", { className: "text-center max-w-sm px-6" }, createElement("span", { className: "material-symbols-rounded text-5xl text-muted-foreground/30 mb-4 block" }, "dns"), createElement("h2", { className: "text-lg font-semibold text-foreground mb-2" }, "No IRC servers"), createElement("p", { className: "text-sm text-muted-foreground mb-4" }, "Connect to an IRC server to start chatting. Click the + button in the sidebar or use the button below."), createElement("button", {
      className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer",
      onClick: () => store.openConnectForm()
    }, createElement("span", { className: "material-symbols-rounded text-base" }, "add"), "Connect to Server")));
  }
  if (state.connectFormOpen) {
    return createElement("div", {
      className: "flex flex-1 min-w-0 items-center justify-center bg-surface-low"
    }, createElement(ConnectForm, null));
  }
  return createElement("div", { className: "flex flex-1 min-w-0 overflow-hidden" }, state.sidebarOpen ? createElement(ChannelSidebar, null) : null, state.sidebarOpen ? createElement(ResizeHandle, null) : null, createElement("div", {
    className: "flex flex-1 min-w-0 flex-col bg-surface-low"
  }, createElement(ChatArea, null)), state.userlistOpen && state.activeChannelName?.startsWith("#") ? createElement(UserList, null) : null);
}
var _p2pJoinInput = "";
function P2PLander() {
  const p2p = p2pStore.getState();
  return createElement("div", {
    className: "flex flex-1 min-w-0 items-start justify-center bg-surface-low overflow-y-auto"
  }, createElement("div", { className: "max-w-lg w-full px-6 py-10" }, createElement("h2", { className: "text-lg font-semibold text-foreground mb-1" }, "P2P Chat"), createElement("p", { className: "text-sm text-muted-foreground mb-6" }, "Join or create a room to start chatting peer-to-peer. No server required."), createElement("form", {
    className: "flex gap-2 mb-6",
    onSubmit: (e) => {
      e.preventDefault();
      const name = _p2pJoinInput.trim();
      if (name) {
        joinRoom2(name);
        p2pStore.addJoinedRoom(name, false);
        _p2pJoinInput = "";
      }
    }
  }, createElement("input", {
    type: "text",
    className: "flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
    placeholder: "Enter room name...",
    oninput: (e) => {
      _p2pJoinInput = e.target.value;
    }
  }), createElement("button", {
    type: "submit",
    className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-online text-white hover:bg-online/90 transition-colors cursor-pointer"
  }, createElement("span", { className: "material-symbols-rounded text-base" }, "add"), "Join")), createElement("h3", { className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2" }, "Community Rooms"), createElement("div", { className: "flex flex-col gap-1" }, ...communityRoomNames.map((name) => createElement("button", {
    key: name,
    className: cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer text-left", p2p.roomId === name ? "bg-online/10 text-online font-medium" : "text-on-surface-variant hover:bg-accent/50 hover:text-foreground"),
    onClick: () => {
      joinRoom2(name);
      p2pStore.addJoinedRoom(name, false);
    }
  }, createElement("span", { className: "material-symbols-rounded text-base flex-shrink-0" }, "tag"), name)))));
}
function P2PContent() {
  const state = store.getState();
  const p2p = p2pStore.getState();
  if (!p2p.roomId) {
    return createElement("div", { className: "flex flex-1 min-w-0 overflow-hidden" }, state.sidebarOpen ? createElement(P2PSidebar, null) : null, state.sidebarOpen ? createElement(ResizeHandle, null) : null, createElement(P2PLander, null));
  }
  return createElement("div", { className: "flex flex-1 min-w-0 overflow-hidden" }, state.sidebarOpen ? createElement(P2PSidebar, null) : null, state.sidebarOpen ? createElement(ResizeHandle, null) : null, createElement("div", {
    className: "flex flex-1 min-w-0 flex-col bg-surface-low"
  }, createElement(P2PChatArea, null)), createElement(P2PPeerList, null));
}
function App() {
  const state = store.getState();
  const isHome = state.appMode === "home";
  const isIrc = state.appMode === "irc";
  const isP2P = state.appMode === "p2p";
  return createElement("div", {
    className: "flex flex-col h-screen w-screen overflow-hidden bg-background"
  }, createElement(ModeTabBar, null), createElement("div", {
    className: "flex flex-1 min-h-0 overflow-hidden"
  }, createElement(NetworkList, null), state.settingsOpen ? createElement(SettingsPage, { key: "settings" }) : null, !state.settingsOpen && isHome ? createElement(HomePage, { key: "home" }) : null, !state.settingsOpen && isIrc ? createElement(IrcContent, { key: "irc" }) : null, !state.settingsOpen && isP2P ? createElement(P2PContent, { key: "p2p" }) : null), state.profilePanelPubkey ? createElement(ProfilePanel, {
    pubkey: state.profilePanelPubkey,
    onClose: () => store.closeProfile()
  }) : null);
}

// src/client/index.ts
socket.connect();
initKeybinds();
p2pStore.init();
nostr.subscribe(() => mount3());
function mount3() {
  const root = document.getElementById("app");
  if (root) {
    render(createElement(App, null), root);
  }
}
store.subscribe(() => mount3());
p2pStore.subscribe(() => mount3());
mount3();
