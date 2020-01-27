# Line Bot

Line 會`post`下面的資料結構回設置的`webhook`

這個專案的例子是 <https://caten-church.org/chatbot/line/callback>

注意`webhook`必為`https`

```json
{
  "events": [
    {
      "type": "message",
      "replyToken": "16456834b271405a896a13c4692cf8e3",
      "source": {
        "userId": "Ub38d4062c864a494a3229bc077a6551d",
        "type": "user"
      },
      "timestamp": 1509884468226,
      "message": {
        "type": "text",
        "id": "6945380161618",
        "text": "hi"
      }
    }
  ],
  "line": {
    "events": [
      {
        "type": "message",
        "replyToken": "16456834b271405a896a13c4692cf8e3",
        "source": {
          "userId": "Ub38d4062c864a494a3229bc077a6551d",
          "type": "user"
        },
        "timestamp": 1509884468226,
        "message": {
          "type": "text",
          "id": "6945380161618",
          "text": "hi"
        }
      }
    ]
  }
}
```
