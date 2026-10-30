// Shared navigation follows actual saved progress, including incomplete earlier steps.
export function learningRoute(card,state){
 const prediction=state.predictions[card.id]!==undefined,observed=state.observed.includes(card.id),answered=state.answers[card.quiz.id]===card.quiz.answer;
 if(!prediction)return{step:0,title:'先留下你的猜想',detail:'選一個想法即可；預測沒有對錯，隨時可以修正。',action:'開始預測 →'};
 if(!observed)return{step:1,title:'帶著猜想，動手找證據',detail:card.task,action:'前往探索 →'};
 if(!answered)return{step:2,title:'觀察完成，驗證你的想法',detail:'只要一題，用剛剛找到的證據作出判斷。',action:'回答小試身手 →'};
 return card.id<12?{step:3,title:'這一站，你已經掌握了',detail:'預測、觀察、驗證都完成。帶著線索前往下一站。',action:'前往第 '+String(card.id+1).padStart(2,'0')+' 站 →'}:{step:2,title:'最後一站已完成',detail:'煮鹽新法已解除鹽荒，可以回看成果，或往下欣賞回家的故事。',action:'回看最後的判斷 →'};
}
