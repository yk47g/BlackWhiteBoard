// components/introducePage/introducePage.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    pageUrlArray: [],
    pageIndex: 0,
    nowPageUrl: "/icons/page_1.png"
  },

  /**
   * 组件的方法列表
   */
  methods: {
    changePage_click(e){
      let data = this.data
      let index = data.pageIndex
      if(e.target.id == "next"){
      
        if (index+1 < data.pageUrlArray.length){
          
          data.pageIndex ++;
          console.log("下一页>>", data.pageIndex)
        }

      }else{
     
        if (index > 0) {
          data.pageIndex --;
          console.log("上一页>>", data.pageIndex)
        }
       
      }
     
    }
  },

  // 组件生命周期
  created:function(){
    //这里面不能使用setdata
  },
  attached: function () {
    // 在组件实例进入页面节点树时执行
    data.pageUrlArray.push("/icons/page_1.png")//默认的的加载中显示。加载完时需要删掉。
    
    //尝试在这里加载url列表即可--------。
    let data = this.data;

    
    


    //在完成后加载刷新----。
    this.setData({
      nowPageUrl: this.data.pageUrlArray[0]
    })
  },
  detached: function () {
    // 在组件实例被从页面节点树移除时执行
  },
})
