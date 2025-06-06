import FullStory from '@fullstory/browser';

interface SessionMarker {
  sessionId: string;
  feedbackId: string;
  timestamp: Date;
  sentiment: number;
}

export class SessionRecording {
  private fullstory: typeof FullStory;
  private baseUrl: string;

  constructor(config: {
    orgId: string;
    baseUrl?: string;
  }) {
    // Initialize FullStory
    this.fullstory = FullStory;
    this.fullstory.init({ orgId: config.orgId });
    this.baseUrl = config.baseUrl || 'https://app.fullstory.com';
  }

  async addFeedbackMarker(marker: SessionMarker): Promise<void> {
    try {
      // Add custom event for the feedback
      this.fullstory.event('User Feedback', {
        feedbackId_str: marker.feedbackId,
        sentiment_int: marker.sentiment,
        timestamp_real: marker.timestamp.getTime(),
      });

      // Add feedback marker to the session timeline
      this.fullstory.getCurrentSession().then(session => {
        if (session) {
          this.fullstory.event('Feedback Marker', {
            sessionId_str: session.id,
            feedbackId_str: marker.feedbackId,
          });
        }
      });
    } catch (error) {
      console.error('Error adding feedback marker:', error);
      throw new Error('Failed to add feedback marker to session recording');
    }
  }

  async getSessionUrl(sessionId: string): Promise<string> {
    try {
      // Get the session details
      const session = await this.fullstory.getCurrentSession();
      if (!session) {
        throw new Error('Session not found');
      }

      // Construct the session replay URL
      return `${this.baseUrl}/session/${sessionId}`;
    } catch (error) {
      console.error('Error getting session URL:', error);
      throw new Error('Failed to get session recording URL');
    }
  }

  // Client-side initialization
  static initializeClient(orgId: string): void {
    const script = document.createElement('script');
    script.text = `
      window['_fs_host'] = 'fullstory.com';
      window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
      window['_fs_org'] = '${orgId}';
      window['_fs_namespace'] = 'FS';
      (function(m,n,e,t,l,o,g,y){
        if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
        g=m[e]=function(a,b,s){g.q?g.q.push([a,b,s]):g._api(a,b,s);};g.q=[];
        o=n.createElement(t);o.async=1;o.crossOrigin='anonymous';o.src='https://'+_fs_script;
        y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
        g.identify=function(i,v,s){g(l,{uid:i},s);if(v)g(l,v,s)};g.setUserVars=function(v,s){g(l,v,s)};g.event=function(i,v,s){g('event',{n:i,p:v},s)};
        g.anonymize=function(){g.identify(!!0)};
        g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
        g.log = function(a,b){g("log",[a,b])};
        g.consent=function(a){g("consent",!arguments.length||a)};
        g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
        g.clearUserCookie=function(){};
        g.setVars=function(n, p){g('setVars',[n,p]);};
        g._w={};y='XMLHttpRequest';g._w[y]=m[y];y='fetch';g._w[y]=m[y];
        if(m[y])m[y]=function(){return g._w[y].apply(this,arguments)};
        g._v="1.3.0";
      })(window,document,window['_fs_namespace'],'script','user');
    `;
    document.head.appendChild(script);
  }

  // Helper methods for user identification and custom events
  identifyUser(userId: string, userVars?: Record<string, any>): void {
    this.fullstory.identify(userId, userVars);
  }

  trackCustomEvent(eventName: string, properties: Record<string, any>): void {
    this.fullstory.event(eventName, properties);
  }

  setPrivacyMode(enabled: boolean): void {
    if (enabled) {
      this.fullstory.anonymize();
    } else {
      this.fullstory.restart();
    }
  }
} 