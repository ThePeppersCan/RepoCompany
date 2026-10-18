// Public host identity is application context, not a fact that must be found in
// a game guide. Never infer a member's ownership, identity or private websites.
export const HOST_CONTEXT = "You are Wibsworth, the friendly AI companion on Repo Company, https://repocompany.uk. This is the site you are helping people use. You know this public identity without needing personal information or a retrieved game document. Wibs is community chat and calls; Reparty is shared listening and watching. Do not assume the member owns this site. If 'my website' is ambiguous, say 'If you mean this site'.";

function normalize(value) {
  return String(value||'').normalize('NFKC').toLowerCase()
    .replace(/\ba\s*\.\s*i(?:\s*\.)?/g,'ai')
    .replace(/(?:https?:\/\/)?(?:www\.)?repocompany\.uk\b/g,'repo company')
    .replace(/[’']/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
export function conversationReply(chat) {
  const text=normalize(chat.question);
  const identity=/^(?:who (?:are you|is wibsworth)|what(?:s| is) your name|are you wibsworth|what are you)$/.test(text);
  if(/^(?:what can you (?:do|help (?:me )?with)|what do you do|what are you for|how can you help me|tell me about yourself)$/.test(text))return {answer:'I’m here to help you find your way around Repo Company — the games, Wibs, Reparty and your account. I can talk through builds and game questions using my checked guides, answer everyday questions, or just keep you company. If a detail is missing, I’ll ask rather than make it up.',sources:[]};
  if(/^(?:thats wrong|that is wrong|youre wrong|you are wrong|this is wrong|that isnt right)$/.test(text))return {answer:'Thanks for catching that. Which part did I get wrong, and what does the game or page say? A little context or an official link will help me check it properly. You can send a lasting correction through my settings for verification and developer review.',sources:[]};
  if(/^(?:please )?(?:remember (?:this|that|i prefer)|learn this|update your knowledge|save this fact)\b/.test(text))return {answer:'I can take that into account while we talk. For future chats, save personal preferences under my settings. For a game or site fact, use Suggest a correction there with the official page link — I’ll check the available references, and a developer can approve it for everyone. I won’t treat an unchecked claim as a fact.',sources:[]};
  const site=/^(?:(?:what|which) (?:web)?site (?:is this|are (?:we|you) on|am i (?:on|using))|what(?:s| is) (?:my|your|our|this|the) (?:web)?site(?: called| name| address| url)?|where am i)$/.test(text);
  const reminder=/^(?:(?:but|yes|no|well|remember|i mean) )?(?:youre|you are|arent you|are you) (?:the |an |a |our |my )?(?:ai|assistant|bot|companion)(?: (?:on|for|in|of))? (?:it |this |the )?(?:repo company(?: site| website)?|website|site|here)(?: right)?$/.test(text)
    || /^(?:youre|you are) (?:on|part of) repo company$/.test(text);
  if(!identity&&!site&&!reminder)return null;
  if(site)return {answer:(/\bmy\b/.test(text)?'If you mean this site, it’s':'You’re on')+' Repo Company — repocompany.uk. I’m Wibsworth, the AI companion here.',sources:[]};
  if(identity)return {answer:'I’m Wibsworth, Repo Company’s little AI companion. I can help with the games, show you around the site, or just have a chat.',sources:[]};
  const lastAssistant=[...(chat.history||[])].reverse().find(item=>item.role==='assistant');
  const dismissed=lastAssistant&&/\b(?:do not have|dont have|can not|cannot|cant)\b/.test(normalize(lastAssistant.content))&&/\b(?:personal|information|website|details|verified)\b/.test(normalize(lastAssistant.content));
  return {answer:'That’s right — I’m Wibsworth, Repo Company’s AI companion.'+(dismissed?' Sorry, I lost the thread there. I do know the site I’m part of.':''),sources:[]};
}

export function serviceQuestion(question){
  const text=normalize(question);
  if(/\b(?:wibs|reparty|moratales|morogue|velmora manager)\b/.test(text))return null;
  if(/\b(?:wibsworth|ai|messages?|prompts?|questions?)\b/.test(text)&&/\b(?:limit|allowance|quota|usage|left|remaining|how many)\b/.test(text)||/^(?:(?:what(?:s| is)|show|check) (?:my|our|your|the) )?(?:daily )?(?:usage|allowance|quota|message limit)$/.test(text))return 'usage';
  if(/(?:what|which) (?:ai |language )?model|are you (?:self hosted|on cloudflare)|where do you run/.test(text))return 'model';
  return null;
}
