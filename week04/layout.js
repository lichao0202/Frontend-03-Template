const defaultAttrList = [
  {
    name: 'flexDirection',
    value: 'row'
  },
  {
    name: 'alignItems',
    value: 'stretch'
  },
  {
    name: 'justifyContent',
    value: 'flex-start'
  },
  {
    name: 'flexWrap',
    value: 'nowrap'
  },
  {
    name: 'alignContent',
    value: 'stretch'
  }
]

function getStyle (element) {
  if (!element.style) element.style = {}

  for (let prop in element.computedStyle) {
    element.style[prop] = element.computedStyle[prop].value

    const value = element.style[prop]
    // 去掉px只保留数值 & 小数化整数 & 字符串转数值
    if (value.toString().match(/px$|^[0-9\.]+$/)) {
      element.style[prop] = parseInt(value)
    }
  }

  return element.style
}

function layout (element) {
  if (!element.computedStyle) {
    return
  }

  var elementStyle = getStyle(element)
  if (elementStyle.display !== 'flex') return // 只处理flex

  // 过滤元素并排序
  let items = element.children.filter(ele => ele.type === 'element')
  items.sort((a, b) => {
    return (a.order || 0) - (b.order || 0)
  })

  const style = elementStyle;

  ['width', 'height'].forEach(s => {
    if (style[s] === 'auto' || style[s] === '') {
      style[s] = null
    }
  })

  defaultAttrList.forEach(item => {
    if (!style[item.name] || style[item.name] === 'auto') {
      style[item.name] = item.value
    }
  })

  // 设置变量名称
  var mainSize, mainEnd, mainStart, mainSign, mainBase,
      crossSize, crossStart, crossEnd, crossSign, crossBase

  if (style.flexDirection === 'row') {
    mainSize= 'width'
    mainStart = 'left'
    mainEnd = 'right'
    mainSign = +1
    mainBase = 0
    crossSize = 'height'
    crossStart = 'top'
    crossEnd = 'bottom'
  } else if (style.flexDirection ===  'row-reverse') {
    mainSize= 'width'
    mainStart = 'right'
    mainEnd = 'left'
    mainSign = -1
    mainBase = style.width
    crossSize = 'height'
    crossStart = 'top'
    crossEnd = 'bottom'
  } else if (style.flexDirection === 'column') {
    mainSize= 'height'
    mainStart = 'top'
    mainEnd = 'bottom'
    mainSign = +1
    mainBase = 0
    crossSize = 'width'
    crossStart = 'left'
    crossEnd = 'right'
  } else if (style.flexDirection === 'column-reverse') {
    mainSize= 'height'
    mainStart = 'bottom'
    mainEnd = 'top'
    mainSign = -1
    mainBase = style.height
    crossSize = 'width'
    crossStart = 'left'
    crossEnd = 'right'
  }

  if (style.flexWrap === 'wrap-reverse') {
    var tmp = crossStart
    crossStart = crossEnd
    crossEnd = tmp
    crossSign = -1
  } else {
    crossBase = 0
    crossSign = 1
  }

  // 一行的情况
  var isAutoMainSize = false
  if (!style[mainSize]) {
    elementStyle[mainSize] = 0
    for (let i=0; i<items.length; i++) {
      const item = items[i]
      const itemStyle = getStyle(item)
      if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== '') {
        elementStyle[mainSize] += itemStyle[mainSize]
      }
    }
    isAutoMainSize = true
  }
  
  const flexLine = []
  const flexLines = [flexLine]

  var mainSpace = elementStyle[mainSize]
  var crossSpace = 0

  for (let i=0; i<items.length; i++) {
    var item = items[i]
    var itemStyle = getStyle(item)

    if (itemStyle[mainSize] == null) {
      itemStyle[mainSize] = 0
    }

    if (itemStyle.flex) {
      flexLine.push(item)
    } else if (itemStyle.flexWrap === 'nowrap' && isAutoMainSize) {
      mainSpace -= itemStyle[mainSize]
      if (itemStyle[crossSize]) {
        crossSpace = Math.max(crossSpace, itemStyle[crossSize])
      }
      flexLine.push(item)
    } else {
      // 换行逻辑

      // 子元素尺寸大于父元素主轴尺寸，压缩子元素
      if (itemStyle[mainSize] > style[mainSize]) itemStyle[mainSize] = style[mainSize]
      if (mainSpace < itemStyle[mainSize]) {
        flexLine.mainSpace = mainSpace // 给数组添加属性
        flexLine.crossSpace = crossSpace
        flexLine = [item]
        flexLines.push(flexLine)
        mainSpace = style[mainSize]
        crossSpace = 0
      } else {
        flexLine.push(item)
      }
      if (itemStyle[crossSize]) {
        crossSpace = Math.max(crossSpace, itemStyle[crossSize])
      }

      mainSpace -= itemStyle[mainSize]
    }
  }
  flexLine.mainSpace = mainSpace

  /** 主轴方向计算 **/
  if (style.flexWrap === 'nowrap' || isAutoMainSize) {
    flexLine.crossSpace = style[crossSize] || crossSpace
  } else {
    flexLine.crossSpace = crossSpace
  }

  if (mainSpace < 0) {
    // 超出父级容器，只在nowrap的情况下才会出现
    const scale = style[mainSize] / (style[mainSize] - mainSpace)
    let currentMain = mainBase
    for (let i=0; i<items.length; i++) {
      const item = items[i]
      const itemStyle = getStyle(item)

      if (itemStyle.flex) itemStyle[mainSize] = 0

      itemStyle[mainSize] = itemStyle[mainSize] * scale

      itemStyle[mainStart] = currentMain
      itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
      currentMain = itemStyle[mainEnd]
    }
  } else {
    flexLines.forEach(items => {
      // 多行，如果子元素有flex值，则按照flex值分配剩余空间
      // 如果子元素都没有flex值，则按照justify-content分配剩余空间
      let mainSpace = items.mainSpace
      let flexTotal = 0

      for (let i=0; i<items.length; i++) {
        const item = items[i]
        const itemStyle = getStyle(item)
        if (itemStyle.flex) {
          flexTotal += itemStyle.flex
          continue
        }
      }

      if (flexTotal > 0) {
        // 子元素有flex值
        var currentMain = mainBase
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const itemStyle = getStyle(item)

          if (itemStyle.flex) {
            itemStyle[mainSize] = (itemStyle.flex / flexTotal) * mainSpace
          }

          itemStyle[mainStart] = currentMain
          itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
          currentMain = itemStyle[mainEnd]
        }
      } else {
        // 子元素没有flex值，按照父级元素的justify-content计算
        if (style.justifyContent === 'flex-start') {
          var currentMain = mainBase
          var step = 0
        }

        if (style.justifyContent === 'flex-end') {
          var currentMain = mainSpace * mainSign + mainBase
          var step = 0
        }

        if (style.justifyContent === 'center') {
          var currentMain = mainSpace / 2 * mainSign + mainBase
          var step = 0
        }

        if (style.justifyContent === 'space-between') {
          var step = mainSpace / (items.length - 1) * mainSign
          var currentMain = mainBase
        }

        if (style.justifyContent === 'space-around') {
          var step = mainSpace / items.length * mainSign
          var currentMain = step / 2 + mainBase
        }

        for (let i = 0; i < items.length; i++) {
          var item = items[i]
          var itemStyle = getStyle(item)

          itemStyle[mainStart] = currentMain
          itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize]
          currentMain = itemStyle[mainEnd] + step
        }
      }
    })
  }

  /** 计算交叉轴 **/
  var crossSpace // 剩余空间
  if (!style[crossSize]) { // 自动撑开
    crossSpace = 0
    elementStyle[crossSize] = 0
    for (let i = 0; i < flexLines.length; i++) {
      elementStyle[crossSize] += flexLines[i].crossSpace
    }
  } else {
    crossSpace = style[crossSize]
    for (let i = 0; i < flexLines.length; i++) {
      crossSpace -= flexLines[i].crossSpace
    }
  }

  if (style.flexWrap === 'wrap-reverse') {
    crossBase = style[crossSize]
  } else {
    crossBase = 0
  }

  var lineSize = style[crossSize] / flexLines.length

  var step
  if (style.alignContent === 'flex-start') {
    crossBase += 0
    step = 0
  }
  if (style.alignContent === 'flex-end') {
    crossBase += crossSign * crossSpace
    step = 0
  }
  if (style.alignContent === 'center') {
    crossBase += crossSign * (crossSpace / 2)
    step = 0
  }
  if (style.alignContent === 'space-between') {
    crossBase += 0
    step = crossSpace / (flexLines.length - 1)
  }
  if (style.alignContent === 'space-around') {
    step = crossSpace / flexLines.length
    crossBase += crossSign * (step / 2)
  }
  if (style.alignContent === 'stretch') {
    step = 0
    crossBase += 0
  }

  flexLines.forEach(items => {
    var lineCrossSize = style.alignContent === 'stretch' ?
        style.crossSpace + crossSpace / flexLines.length :
        style.crossSpace
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const itemStyle = getStyle(item)

      const align = itemStyle.alignSelf || style.alignItems

      if (itemStyle[crossSize] === null) {
        itemStyle[crossSize] = align === 'stretch' ? lineCrossSize : 0
      }

      if (align === 'flex-start') {
        itemStyle[crossStart] = crossBase
        itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize]
      }
      if (align === 'flex-end') {
        itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize
        itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize]
      }
      if (align === 'center') {
        itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize] / 2)
        itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize]
      }
      if (align === 'stretch') {
        itemStyle[crossStart] = crossBase
        itemStyle[crossEnd] = crossBase + crossSign * (itemStyle[crossSize] || 0)
      }
    }
    crossBase += crossSign * (lineCrossSize + step)
  })

  console.log('items:', items)
}

module.exports = layout