<script lang="ts">
  import {
    Folder,
    Sparkles,
    Users,
    MapPin,
    Gem,
    BookOpen,
    Flag,
    Moon,
    Leaf,
    KeyRound
  } from '@lucide/svelte';
  import type { StoryFolder } from '#lib/domain/organization';
  let { name = 'folder', size = 16 }: { name?: StoryFolder['icon']; size?: number } = $props();
  const icons = {
    folder: Folder,
    sparkles: Sparkles,
    users: Users,
    map: MapPin,
    gem: Gem,
    book: BookOpen,
    flag: Flag,
    moon: Moon,
    leaf: Leaf,
    key: KeyRound
  };
  const Icon = $derived(icons[name]);
</script>

<Icon {size} />
