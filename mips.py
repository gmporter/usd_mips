# author: oskar.blom@gmail.com
#
# Make sure your gevent version is >= 1.0
import gevent
from time import gmtime, strftime
from gevent.wsgi import WSGIServer
from gevent.queue import Queue

from flask import Flask, Response, url_for, send_from_directory

import time

# what state is each team in?
# note: there are 5 elements so we don't have to keep adjusting by 1
#  to map team numbers to states
team_states = [-1, 0, 0, 0, 0]

# SSE "protocol" is described here: http://mzl.la/UPFyxY
class ServerSentEvent(object):

    def __init__(self, data):
        self.data = data
        self.event = None
        self.id = None
        self.desc_map = {
            self.data : "data",
            self.event : "event",
            self.id : "id"
        }

    def encode(self):
        if not self.data:
            return ""
        lines = ["%s: %s" % (v, k) 
                 for k, v in self.desc_map.items() if k]
        
        return "%s\n\n" % "\n".join(lines)

app = Flask(__name__)
subscriptions = []

# Client code consumes like this.
@app.route("/")
def index():
    return app.send_static_file('index.html')

@app.route("/admin")
def admin():
    return app.send_static_file('admin.html')

@app.route("/current_state")
def current_state():
    return ','.join(map(str,team_states))

@app.route("/reset")
def reset():
    global team_states

    def notify():
        msg = ','.join(map(str,team_states))
        for sub in subscriptions[:]:
            sub.put(msg)
    
    team_states = [-1, 0, 0, 0, 0]
    gevent.spawn(notify)
    return str(team_states)

@app.route("/advance_state/<int:team_num>")
def advance_state(team_num):
    def notify():
        msg = ','.join(map(str,team_states))
        for sub in subscriptions[:]:
            sub.put(msg)
    
    print('advancing state for team {}'.format(team_num))
    team_states[team_num] += 1
    gevent.spawn(notify)
    return str(team_states)

@app.route("/subscribe")
def subscribe():
    print('new subscriber')
    def gen():
        q = Queue()

        subscriptions.append(q)
        try:
            while True:
                result = q.get()
                ev = ServerSentEvent(str(result))
                yield ev.encode()
        except GeneratorExit: # Or maybe use flask signals
            subscriptions.remove(q)

    return Response(gen(), mimetype="text/event-stream")

@app.route('/<path:path>')
def static_file(path):
    return app.send_static_file(path)

if __name__ == "__main__":
    app.debug = True
    server = WSGIServer(("0.0.0.0", 5000), app)
    server.serve_forever()
