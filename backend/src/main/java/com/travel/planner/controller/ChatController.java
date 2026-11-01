package com.travel.planner.controller;

import com.travel.planner.dto.ChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

/**
 * Simple chat controller for demo purposes.
 *
 * Clients send a message to "/app/chat.sendMessage" and the payload is broadcast
 * to all subscribers of "/topic/public".
 */
@Controller
public class ChatController {

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(ChatMessage message) {
        // In a real app you might enrich the message (timestamp, user, etc.)
        return message;
    }
}
