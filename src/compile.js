import { Watcher } from './dep';
import { getValue } from './utils';

export class Compile {
  constructor(el ,vm) {
    this.$el = document.querySelector(el);
    this.$vm = vm;
    if (this.$el) {
      // 转换内容为片段fragment
      this.$fragment = this.node2Fragment(this.$el);
      // 编译为dom元素
      this.compile(this.$fragment);
      // 插入到el下
      this.$el.appendChild(this.$fragment);
    }
  }

  node2Fragment(el) {
    const fragment = document.createDocumentFragment();
    // 将el中的元素移到fragment中
    let child;
    while(child = el.firstChild) {
      // 每添加一次el中的child就少一个
      fragment.appendChild(child)
    }
    return fragment;
  }

  compile(fragment) {
    const childNodes = fragment.childNodes;
    Array.from(childNodes).forEach(node => {
      if (this.isElement(node)) {
        // 判断自定义的指令集
        Array.from(node.attributes).forEach(attr => {
          const attrName = attr.name;
          // key (name或者age)
          const exp = attr.value;
          if (this.isDirective(attrName)) {
            // v-text v-model
            const dir = attrName.substring(2); // 取出v-后面的字符串
            // 执行更新 this.model() this.text()
            this[dir] && this[dir](node, this.$vm, exp);
          }
          if (this.isEvent(attrName)) {
            // @click
            const dir = attrName.substring(1);
            this.eventHandler(node, this.$vm, exp, dir)
          }
        })
      } else if (this.isInterpolation(node)) {
        this.compileText(node);
      }
      if (node.childNodes && node.childNodes.length) {
        this.compile(node);
      }
    })
  }

  // 双向绑定处理器
  model(node, vm, exp) {
    // 指定input的value值
    this.update(node, vm, exp, 'model');

    // 更新值触发setter
    node.addEventListener("input", e => {
      vm[exp] = e.target.value;
    })
  }

  modelUpdater(node, value) {
    node.value = value;
  }

  html(node, vm, exp) {
    this.update(node, vm, exp, 'html');
  }

  htmlUpdater(node, value) {
    node.innerHTML = value;
  }

  // @事件处理器
  eventHandler(node, vm, exp, dir) {
    const fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir === 'click' && fn) {
      node.removeEventListener('click', fn)
      node.addEventListener('click', fn.bind(vm))
    }
  }

  text(node, vm, exp) {
    this.update(node, vm, exp, 'text')
  }

  compileText(node) {
    this.update(node, this.$vm ,RegExp.$1, 'text');
  }

  // 更新函数
  update(node, vm, exp, dir) {
    const updateFn = this[`${dir}Updater`];
    updateFn && updateFn(node, getValue(vm, exp));
    // updateFn && updateFn(node, vm[exp]);
    // 依赖收集
    new Watcher(vm, exp, function(val) {
      console.log(`new watcher(${exp})`);
      updateFn && updateFn(node, val);
    })
  }

  textUpdater(node, value) {
    node.textContent = value;
  }

  isDirective(attr) {
    return attr.startsWith('v-');
  }

  isEvent(attr) {
    return attr.startsWith('@');
  }

  isElement(node) {
    return node.nodeType === 1;
  }

  isInterpolation(node) {
    const text = node.innerText;
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }
}