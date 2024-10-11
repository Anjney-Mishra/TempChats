import { useEffect, useState,useMemo } from 'react'
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

  const socket = useMemo(()=>io('https://tempchatsserver.onrender.com'),[]);

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
  }

  const handleJoinRoom = (e)=>{
    e.preventDefault();
    socket.emit('joinRoom',{roomId:room,name});
    toast(`Joined Room: ${room}`,{icon:'✅'})
    setHider(true)
  }

  useEffect(()=>{
    socket.on('connect',()=>{
      setSid(socket.id)
    })

    setColor(generateRandomColor());

    socket.on('userjoined',(data)=>{
      toast(`${data.name} Joined the Room`,{icon:'👋'})
    })

    socket.on('roomsize',(data)=>{
      setPeople(data)
    })

    socket.on("response",(data)=>{
      setMessages((messages)=>[...messages,data])
    })

    return ()=>{
      socket.disconnect({roomId:room,name})
    }

  },[])


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

    <Card className='m-2 h-[60vh] p-4 overflow-y-scroll'>
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
