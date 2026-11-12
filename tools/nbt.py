# Minimaler NBT-Leser/-Schreiber (Little Endian, Bedrock level.dat)
import struct, io
def r(fmt, f): return struct.unpack('<'+fmt, f.read(struct.calcsize('<'+fmt)))[0]
def rstr(f): n=r('H',f); return f.read(n).decode('utf8')
def rpay(t,f):
    if t==1: return r('b',f)
    if t==2: return r('h',f)
    if t==3: return r('i',f)
    if t==4: return r('q',f)
    if t==5: return r('f',f)
    if t==6: return r('d',f)
    if t==7: n=r('i',f); return bytearray(f.read(n))
    if t==8: return rstr(f)
    if t==9:
        et=r('b',f); n=r('i',f); return ('list',et,[rpay(et,f) for _ in range(n)])
    if t==10:
        d={}
        while True:
            tt=r('b',f)
            if tt==0: break
            name=rstr(f); d[name]=(tt,rpay(tt,f))
        return d
    if t==11: n=r('i',f); return [r('i',f) for _ in range(n)]
    if t==12: n=r('i',f); return [r('q',f) for _ in range(n)]
    raise Exception('tag %d'%t)
def w(fmt,v,f): f.write(struct.pack('<'+fmt,v))
def wstr(s,f): b=s.encode('utf8'); w('H',len(b),f); f.write(b)
def wpay(t,v,f):
    if t==1: w('b',v,f)
    elif t==2: w('h',v,f)
    elif t==3: w('i',v,f)
    elif t==4: w('q',v,f)
    elif t==5: w('f',v,f)
    elif t==6: w('d',v,f)
    elif t==7: w('i',len(v),f); f.write(v)
    elif t==8: wstr(v,f)
    elif t==9:
        _,et,items=v; w('b',et,f); w('i',len(items),f)
        for it in items: wpay(et,it,f)
    elif t==10:
        for name,(tt,vv) in v.items(): w('b',tt,f); wstr(name,f); wpay(tt,vv,f)
        w('b',0,f)
    elif t==11: w('i',len(v),f); [w('i',x,f) for x in v]
    elif t==12: w('i',len(v),f); [w('q',x,f) for x in v]
def load(path):
    data=open(path,'rb').read()
    ver,ln=struct.unpack('<ii',data[:8]); f=io.BytesIO(data[8:])
    t=r('b',f); name=rstr(f); return ver,name,rpay(t,f)
def save(path,ver,name,root):
    f=io.BytesIO(); w('b',10,f); wstr(name,f); wpay(10,root,f); b=f.getvalue()
    open(path,'wb').write(struct.pack('<ii',ver,len(b))+b)
