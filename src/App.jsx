import { useEffect, useState,useMemo,useRef } from 'react'
import './App.css'
import {io} from 'socket.io-client'
import { IoSendSharp } from "react-icons/io5";
import { Button,Card,Avatar,Typography, Input } from "@material-tailwind/react";
import toast, { Toaster } from 'react-hot-toast';

function App() {

  const [message, setMessage] = useState("");
  const [name,setName] = useState("");
  const [room, setRoom] = useState("");
  const [sid,setSid] = useState("");
  const [color,setColor] = useState("black");
  const [messages, setMessages] = useState([]);
  const [people,setPeople] = useState(0);
  const [hider,setHider] = useState(false);

  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  const socket = useMemo(()=>io('https://tempchatsserver.onrender.com'),[]);
  // const socket = useMemo(()=>io('http://localhost:3000'),[]);

  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleSubmit = (e)=>{
    e.preventDefault();
    socket.emit('message',{name,message,room,sid,color});
    setMessage("");
    inputRef.current.focus();
  }

  const handleJoinRoom = (e)=>{
    e.preventDefault();
    socket.emit('joinRoom',{roomId:room,name});

    socket.on('joinedRoom',({roomId,roomSize})=>{
      toast(`Joined Room: ${roomId}`,{icon:'✅'})
      setPeople(roomSize)
      setHider(true)
    })

    socket.on('connect_error',()=>{
      toast.error('Something went wrong unable to connect to server');
      setHider(false)
    })
    socket.on('disconnect', () => {
      toast.error('Disconnected from the server.');
    });
  }

  useEffect(()=>{
    socket.on('connect',()=>{
      setSid(socket.id)
    })

    setColor(generateRandomColor());

    socket.on('userjoined',(data)=>{
      toast(`${data.name} Joined the Room`,{icon:'👋'})
    })

    socket.on('UserLeft',({leftname,roomSize})=>{
      console.log(leftname,roomSize)
      toast(`${leftname} Left the Room`,{icon:'👋'});
      setPeople(roomSize);
    })

    socket.on('roomsize',(data)=>{
      setPeople(data)
    })

    socket.on("response",(data)=>{
      setMessages((messages)=>[...messages,data])
    })
    return ()=>{
      socket.disconnect();
    }
  },[])

  useEffect(()=>{
    if(chatContainerRef.current)
    {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  },[messages])




  return (
    <>
    {
      !hider ? (
        <Card className='p-2 mt-1'>
          <form onSubmit={handleJoinRoom} className='flex flex-col md:flex-row items-center justify-between'>
            <div className='flex flex-col md:flex-row md:items-center w-full'>
              <input
                type="text"
                placeholder='Enter Name'
                onChange={(e) => setName(e.target.value)}
                value={name}
                className='border border-gray-500 p-2 rounded-lg mr-2 mb-2 md:mb-0 w-full md:w-auto'
              />
              <input
                type="text"
                placeholder='Enter Room Id'
                onChange={(e) => setRoom(e.target.value)}
                value={room}
                className='border border-gray-500 p-2 rounded-lg mr-2 mb-2 md:mb-0 w-full md:w-auto'
              />
              <Button type="submit" className='mb-2 md:mb-0'>Join</Button>
            </div>
            <h1 className='text-2xl mt-2 md:mt-0 md:ml-3'>Online <span className='font-bold'>{people}</span></h1>
          </form>
        </Card>
      ) : (
        <Card className='p-2 mt-1'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <h1 className='font-bold text-xl mb-2 md:mb-0'>Joined Room: {room}</h1>
            <h1 className='text-2xl'>Online <span className='font-bold'>{people}</span></h1>
          </div>
        </Card>
      )
    }

    <Card className='m-2 h-[60vh] p-4 overflow-y-scroll hide-scrollbar' ref={chatContainerRef}>
      {
        messages.map((message, index) => {
          const isSender = message.sid === sid; // Check if the message is from the sender

          return (
            <div 
              key={index} 
              className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}
            >
              <p 
                className={`p-2 rounded-lg max-w-[75%] bg-blue-gray-50 break-words ${
                  isSender ? 'text-right' : 'text-left'
                }`}
              >
                <span className='font-bold' style={{color: message.color}}>{message.name}:</span> {message.message}
              </p>
            </div>
          );
        })
      }
    </Card>

    <Card className='p-5 mt-3'>
      <form onSubmit={handleSubmit} className='flex items-center w-full'>
        <input
          type="text"
          placeholder='Message...'
          onChange={(e) => setMessage(e.target.value)}
          value={message}
          ref={inputRef}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
          className='border border-gray-500 p-2 text-xl rounded-lg mr-2 w-full'
        />
        <Button type="submit" size='lg' className='w-auto'><IoSendSharp /></Button>
      </form>
    </Card>

    <Toaster />
  </>
  )
}

export default App
