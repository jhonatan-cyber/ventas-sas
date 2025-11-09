import Script from 'next/script'

export function ChatWidget() {
  const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
  const intercomAppId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID

  if (!crispWebsiteId && !intercomAppId) {
    return null
  }

  return (
    <>
      {/* Crisp Chat Widget */}
      {crispWebsiteId && (
        <Script id="crisp-chat" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            window.$crisp=[];
            window.CRISP_WEBSITE_ID="${crispWebsiteId}";
            (function(){
              var d=document;
              var s=d.createElement("script");
              s.src="https://client.crisp.chat/l.js";
              s.async=1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
          `
        }} />
      )}

      {/* Intercom Widget */}
      {intercomAppId && (
        <Script id="intercom-chat" strategy="afterInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var w=window;
              var ic=w.Intercom;
              if(typeof ic==="function"){
                ic('reattach_activator');
                ic('update',w.intercomSettings);
              }else{
                var d=document;
                var i=function(){i.c(arguments);};
                i.q=[];i.c=function(args){i.q.push(args);};
                w.Intercom=i;
                var l=function(){
                  var s=d.createElement('script');
                  s.type='text/javascript';
                  s.async=true;
                  s.src='https://widget.intercom.io/widget/${intercomAppId}';
                  var x=d.getElementsByTagName('script')[0];
                  x.parentNode.insertBefore(s,x);
                };
                if(document.readyState==='complete'){l();}
                else if(w.attachEvent){w.attachEvent('onload',l);}
                else{w.addEventListener('load',l,false);}
              }
            })();
          `
        }} />
      )}
    </>
  )
}

