
const URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/ovdp?json";

let appConfig = {
    data(){
        return {
            NBU: [],
            checkedAttractions: [],
            checked: false, 
        }
    },
    methods: {
       checkedAll: function(){
           this.checked = !this.checked;
           console.log(this.checked)
        //    if(this.checked){
        //        for (let element of this.NBU) {
        //            this.checkedAttractions.push(element.attraction);
        //        }
        //    }else{
        //         this.checkedAttractions = [];
        //    }
       }
    },
    computed:{
        checkDebt: function(){
            let result = this.checkedAttractions.reduce(function(sum, elem) {
                return sum + elem;
            }, 0);
            return result;
        },
        totalDebt: function(){
           let debt = 0;
           for (const element of this.NBU) { 
               debt +=element.attraction;
           } 
           return debt.toLocaleString('ru-RU');
        }
    },
    async mounted(){
        let info = await fetch(URL);
            info = await info.json();

        this.NBU = info;

        //Фильтрация
        this.NBU = this.NBU.filter(function(elem){
            return elem.attraction !== 0 ? true : false;
        });
        
        //Конвертация валюты в UAH
          for (let item of this.NBU) {
            item.repaydate = item.repaydate.split(".").reverse().join("-");
            if (item.valcode == "USD") {
                item.attraction *= 28;
                item.valcode = "UAH";
            } else if (item.valcode == "EUR") {
                item.attraction *= 33;
                item.valcode = "UAH";
            }
        }

        //Сортировка
        this.NBU.sort(function (a, b){
            if (a.repaydate < b.repaydate) {
                return 1;
            }
            if (a.repaydate > b.repaydate) {
                return -1;
            }
            // a должно быть равным b
            return 0; 
              
        });

         //Вычисление суммы платежей с одинаковой датой 
        const output = this.NBU.reduce((accumulator, cur) => {
              let date = cur.repaydate;
              let found = accumulator.find(elem => elem.repaydate === date)
              if (found) found.attraction += cur.attraction;
              else accumulator.push(cur);
              return accumulator;
            }, []);
            
        this.NBU = output;
        //Округление
        for (let element of this.NBU) {
            element.attraction = +element.attraction.toFixed(2);
        }
        // console.log(this.NBU)
    }
}

let app = Vue.createApp(appConfig);

app.component('component-debt', {
    props: [ 'comprepaydate', 'compattraction', 'compgrouparr', 'flag' ],
    data(){
        return{
            checkedC: this.flag
        }
    },
    methods:{
        checkedComponentToArr: function(){
            this.checkedC = !this.checkedC;
            if (this.checkedC === true){
                this.compgrouparr.push(this.compattraction);
            }else{
                this.compgrouparr.splice(this.compgrouparr.indexOf(this.compattraction), 1)
            }  
        }
    },
    computed:{
        componentsCheck: function(){
            let checkedC = this.flag;
            return checkedC
        }
    }, 
    template:/*html*/ `
    <div  class="custom-control custom-checkbox my-2" >
        <input  type="checkbox" class="custom-control-input" id="repaydate" value="attraction" v-model='checkedC' @click="checkedComponentToArr"> 
        <label  class="custom-control-label" for="repaydate" > Год {{ comprepaydate }} Долг для выплат: {{compattraction}} грн.   Flag {{flag}}  CheckedC {{checkedC}}</label>
    </div>  
    `
});

app.mount('#app');
