/**
 * Created by nazarigonzalez on 11/1/17.
 */

export default class ErrorBox {
  el:HTMLDivElement = document.body.querySelector("div#error-container") as HTMLDivElement;
  msg:HTMLSpanElement = document.body.querySelector("span#msg-error") as HTMLSpanElement;
  closeBtn:HTMLButtonElement = document.body.querySelector("button#close-error") as HTMLButtonElement;

  constructor(){
    this.closeBtn.addEventListener("click", this.__onClose);
  }

  show(msg:string){
    this.el.style.display = "block";
    this.msg.innerText = msg;
  }

  onClose(){}

  hide(){
    this.el.style.display = "none";
  }

  private __onClose = (evt:any)=>{
    this.hide();
    this.onClose();
  };
}