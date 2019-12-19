/* show
*  0:没有卡片
*  1:翻开的卡片 
*  2:盖上的卡片
*/
var animaConfig = {
    '1': '象',
    '2': '狮',
    '3': '虎',
    '4': '豹',
    '5': '狼',
    '6': '狗',
    '7': '猫',
    '8': '鼠'
}

var socket = null
connectSocket();
var chessInfo = JSON.parse(localStorage['chessInfo'] ||'{}')
var app = new Vue({
    el: '#app ',
    created: function () {
      this.init()
      if (chessInfo.roomId) {
        this.userName = chessInfo.userName
        this.roomId = chessInfo.roomId
        this.connectSocket()
      }
    },
    data: {
        animaConfig: animaConfig,
        heroType: '',
        socketStatus: false,
        userName: '',
        roomId: '',
        gameStatus: 'player2',
        chooseIndex: null, //选中的卡片
        chooseIndex_: null, // 选中的卡片
        list: [
            {type: '1', show: 2, heroType: 'player1'},
            {type: '2', show: 2, heroType: 'player1'},
            {type: '3', show: 2, heroType: 'player1'},
            {type: '4', show: 2, heroType: 'player1'},
            {type: '5', show: 2, heroType: 'player1'},
            {type: '6', show: 2, heroType: 'player1'},
            {type: '7', show: 2, heroType: 'player1'},
            {type: '8', show: 2, heroType: 'player1'},
            {type: '1', show: 2, heroType: 'player2'},
            {type: '2', show: 2, heroType: 'player2'},
            {type: '3', show: 2, heroType: 'player2'},
            {type: '4', show: 2, heroType: 'player2'},
            {type: '5', show: 2, heroType: 'player2'},
            {type: '6', show: 2, heroType: 'player2'},
            {type: '7', show: 2, heroType: 'player2'},
            {type: '8', show: 2, heroType: 'player2'}
        ],
        gameList: [[], [], [], []]
    },
    methods: {
        init() {
            // 对卡片做乱序处理
            var list = []
            while (this.list.length) {
                var item = this.list.splice(parseInt(Math.random() * this.list.length), 1)
                list.push(item[0])
            }
            // 将乱序的对象添加到gameList
            for (let index = 0; index < list.length; index++) {
                this.gameList[parseInt(index / 4)].push(list[index])
            }
        },
        connectSocket() {
            socket.emit('join room', {
                userName: this.userName,
                roomId: this.roomId
            });
            localStorage['chessInfo'] = JSON.stringify({
                userName: this.userName,
                roomId: this.roomId
            })
        },
        itemClass(item) {
            if (item.show === 0) return 'opra'
            if (item.show === 2) return ''
            if (item.show === 1) {
                return item.heroType === 'player1' ? 'hero0' : 'hero1'
            }
        },
        moveCard() {
            socket.emit('moveCard', this.gameList);
            this.gameStatus = ''
        },
        checkNext(index, index_) {
            return (Math.abs(index_ - this.chooseIndex_) + Math.abs(index - this.chooseIndex) === 1)
        },
        chooseItem(index, index_) {
            // 判断当前是否可以操作
            if (this.gameStatus !== this.heroType) return

            var item = this.gameList[index][index_]
            // 如果卡片还没有翻开就翻开卡片 返回
            if (item.show === 2) {
                item.show = 1
                this.chooseIndex = null
                this.chooseIndex_ = null
                this.moveCard()
                return
            }
            // 如果是自己的卡片，就记录位置已准备移动
            if (this.heroType === item.heroType && item.show === 1) {
                this.chooseIndex = index
                this.chooseIndex_ = index_
            } else {
                // 如果不是就比较预期位置卡片和已选卡片的属性
                if (this.chooseIndex === null) return
                var choosedItem = this.gameList[this.chooseIndex][this.chooseIndex_]
                // 检查是不是大象吃老鼠
                if ((choosedItem.type === '1' && item.type === '8') && item.show === 1) return
                // 检查是不是相邻的
                if (!this.checkNext(index, index_)) return
                if (choosedItem.type < item.type || item.show === 0 || (choosedItem.type === '8' && item.type === '1')) {
                    // 将已选卡片移位
                    var temp = {
                        type: choosedItem.type,
                        show: choosedItem.show,
                        heroType: choosedItem.heroType
                    }

                    choosedItem.type = item.type
                    choosedItem.show = 0
                    choosedItem.heroType = item.heroType

                    item.type = temp.type
                    item.show = temp.show
                    item.heroType = temp.heroType

                    this.chooseIndex = null
                    this.chooseIndex_ = null
                    this.moveCard()
                }
            }
        }
    }
})


function connectSocket() {
  const config = {
    path: ''
  }
  if (location.pathname.indexOf('chess')!==-1){
    config.path = '/chess/socket.io'
  }
    socket = io.connect('/',config);
    socket.on('getList', function (data) {
      if (data.length){
        app.gameList = data;
      }
    });
    socket.on('getHeroType', function (data) {
        app.heroType = data
        app.socketStatus = true
    });
    socket.on('add user', function (userName) {
        Materialize.toast('欢迎' + userName + '加入房间!', 4000)
    });
    socket.on('nowRound', function (nowRound) {
      app.gameStatus = nowRound
  });
    socket.on('error message', function (mess) {
        Materialize.toast(mess, 4000)
    });
    socket.on('alive', function (mess) {
      socket.emit('alive', app.userName);
  });
}
