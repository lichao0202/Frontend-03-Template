学习笔记

资料：
网站。。。

状态机在实际工作中有何用途？能解决什么问题？


如果将css全部写进style属性，那么就不需要css computing ？？ chapter8


css优先级计算：（属性等其他选择器呢？）查一下优先级资料吧
[inline, id, class, tagName]

div div #id
[0, 1, 0, 2]

div #my #id
[0, 2, 0, 1]

从前往后依次比较，高位胜出，则该规则优先级更高。以上两个规则，第二个优先级更高

