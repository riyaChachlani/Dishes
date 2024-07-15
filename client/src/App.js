// src/App.js
// src/App.js
import React, { useEffect, useState } from "react";
import { Table, Switch, message } from "antd";
import axios from "axios";
import io from "socket.io-client";
import "./App.css";

const App = () => {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDishes = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5008/api/dishes");
      setDishes(response.data);
    } catch (err) {
      console.error("Error fetching dishes:", err);
      message.error("Failed to fetch dishes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const togglePublished = async (id) => {
    try {
      await axios.post(`http://localhost:5008/api/dishes/${id}/toggle`);
    } catch (err) {
      console.error("Error toggling dish:", err);
      message.error("Failed to toggle dish. Please try again later.");
    }
  };

  useEffect(() => {
    fetchDishes();

    const socket = io("http://localhost:5008");

    //Listening for real-time updates
    socket.on("dishUpdated", (updatedDish) => {
      setDishes((prevDishes) =>
        prevDishes.map((dish) =>
          dish._id === updatedDish._id ? updatedDish : dish
        )
      );
    });
    return () => socket.disconnect();
  }, []);

  const columns = [
    {
      title: "Dish Name",
      dataIndex: "dishName",
      key: "dishName",
    },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (text) => <img src={text} alt="Dish" width={50} />,
    },
    {
      title: "Published",
      dataIndex: "isPublished",
      key: "isPublished",
      render: (text, record) => (
        <Switch
          checked={record.isPublished}
          onChange={() => togglePublished(record._id)}
        />
      ),
    },
  ];

  return (
    <div className="App">
      <Table
        dataSource={dishes}
        columns={columns}
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
};

export default App;
