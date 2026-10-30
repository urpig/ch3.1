// Guide students to the first incomplete step: exploration, then one quiz.
export function learningRoute(card,state){
 const observed=state.observed.includes(card.id),answered=state.answers[card.quiz.id]===card.quiz.answer;
 if(!observed)return{step:0,title:'動手探索，找出證據',detail:card.task,action:'前往探索 →'};
 if(!answered)return{step:1,title:'觀察完成，驗證你的想法',detail:'只要一題，用剛剛找到的證據作出判斷。',action:'回答小試身手 →'};
 return card.id<12?{step:2,title:'這一站，你已經掌握了',detail:'探索與驗證都完成。帶著線索前往下一站。',action:'前往第 '+String(card.id+1).padStart(2,'0')+' 站 →'}:{step:1,title:'最後一站已完成',detail:'煮鹽新法已解除鹽荒，可以回看成果，或往下欣賞回家的故事。',action:'回看最後的判斷 →'};
}
