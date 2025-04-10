# Generated by Django 5.0.6 on 2025-04-11 14:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_notification'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(choices=[('ISSUE_CREATED', 'Issue Created'), ('ISSUE_ASSIGNED', 'Issue Assigned'), ('STATUS_CHANGED', 'Status Changed'), ('NEW_ISSUE', 'New Issue'), ('STATUS_UPDATE', 'Status Update')], max_length=20),
        ),
    ]
