# Generated by Django 2.0.4 on 2018-04-30 18:40

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('afinspect', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='status',
            name='status_json',
            field=django.contrib.postgres.fields.jsonb.JSONField(blank=True, default={}),
        ),
    ]
