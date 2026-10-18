// Small, explicit corrections for factual errors found in model evaluation.
// These are ordinary world facts, never Repo Company lore or a live web search.
// Do not broaden a match to questions the cited reference does not answer.
export function generalReviewedReply(chat) {
  const question=chat.question.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  if(/^(?:where(?:s| is) lynmouth(?: located)?|(?:which|what) (?:part of (?:england|devon)|county) is lynmouth in|is lynmouth (?:in|near) exeter)$/.test(question))return {
    answer:'Lynmouth is a village on the north coast of Devon, England, in Exmoor National Park. The East and West Lyn rivers meet there before reaching the Bristol Channel.'+(/exeter/.test(question)?' It isn’t on the Exe Estuary near Exeter.':''),
    sources:[{id:'general-lynmouth',title:'Exmoor National Park — rivers and Lynmouth',url:'https://www.exmoor-nationalpark.gov.uk/enpa/exmoor-national-park-management-plan/bringing-it-all-together-place-based-delivery/rivers%2C-streams-and-wetlands',version:'Checked 18 October 2026',status:'current'}]
  };
  return null;
}
