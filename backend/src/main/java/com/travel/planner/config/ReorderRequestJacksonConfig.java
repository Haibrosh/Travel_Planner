package com.travel.planner.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationConfig;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.databind.deser.BeanDeserializerModifier;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;
import com.fasterxml.jackson.databind.deser.ResolvableDeserializer;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.type.CollectionType;
import com.travel.planner.dto.ReorderItemRequest;
import org.springframework.boot.jackson.JsonComponent;
import org.springframework.context.annotation.Bean;

import java.io.IOException;
import java.util.List;

/**
 * Chức năng: Hỗ trợ Jackson deserialize linh hoạt List<ReorderItemRequest>
 * từ cả mảng JSON trực tiếp ([...]) lẫn object bọc ({ "items": [...] }).
 */
@JsonComponent
public class ReorderRequestJacksonConfig {

    @Bean
    public Module reorderRequestJacksonModule() {
        SimpleModule module = new SimpleModule("ReorderRequestModule");
        module.setDeserializerModifier(new BeanDeserializerModifier() {
            @Override
            public JsonDeserializer<?> modifyCollectionDeserializer(
                    DeserializationConfig config,
                    CollectionType type,
                    BeanDescription beanDesc,
                    JsonDeserializer<?> deserializer) {
                if (type.getContentType() != null && type.getContentType().hasRawClass(ReorderItemRequest.class)) {
                    return new FlexibleReorderListDeserializer(deserializer);
                }
                return deserializer;
            }
        });
        return module;
    }
}

final class FlexibleReorderListDeserializer extends JsonDeserializer<List<ReorderItemRequest>>
        implements ContextualDeserializer, ResolvableDeserializer {

    private final JsonDeserializer<?> delegate;

    FlexibleReorderListDeserializer(JsonDeserializer<?> delegate) {
        this.delegate = delegate;
    }

    @Override
    public void resolve(DeserializationContext ctxt) throws JsonMappingException {
        if (delegate instanceof ResolvableDeserializer resolvable) {
            resolvable.resolve(ctxt);
        }
    }

    @Override
    public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property)
            throws JsonMappingException {
        if (delegate instanceof ContextualDeserializer contextual) {
            JsonDeserializer<?> contextualDelegate = contextual.createContextual(ctxt, property);
            return new FlexibleReorderListDeserializer(contextualDelegate);
        }
        return this;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<ReorderItemRequest> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        if (p.currentToken() == JsonToken.START_OBJECT) {
            JsonNode root = ctxt.readTree(p);
            JsonNode itemsNode = root.get("items");
            if (itemsNode == null || !itemsNode.isArray()) {
                return (List<ReorderItemRequest>) ctxt.reportInputMismatch(
                        List.class,
                        "Payload dạng object phải chứa trường 'items' là một mảng hợp lệ."
                );
            }
            try (JsonParser itemsParser = itemsNode.traverse(p.getCodec())) {
                itemsParser.nextToken();
                return (List<ReorderItemRequest>) delegate.deserialize(itemsParser, ctxt);
            }
        }
        return (List<ReorderItemRequest>) delegate.deserialize(p, ctxt);
    }
}
