/**
 * Created by nazarigonzalez on 23/12/16.
 */

package core

import (
	"fmt"
	"net/smtp"

	"../logger"
)

func send(to, subject, body string) error {
	from := "email@email.a"
	pass := "megapassword"

	msg := fmt.Sprintf(
		"From: %s\n"+
			"To: %s\n"+
			"Subject: %s\n\n %s",
		from, to, subject, body,
	)

	return smtp.SendMail(
		"smtp-mail.-:587",
		smtp.PlainAuth("", from, pass, "smtp-mail.-"),
		from, []string{to}, []byte(msg),
	)
}

func SendDisconnectedWarning(to, serverId string) {
	msg := "Disconnected " + serverId
	if err := send(to, "Server down.", msg); err != nil {
		logger.Warn("Unable to send warning email.")
		logger.Error(err)
	} else {
		logger.Info("Sended warning email")
	}
}
